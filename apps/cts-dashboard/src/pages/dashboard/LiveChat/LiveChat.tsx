import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { LoaderCircleIcon } from "lucide-react";
import { cn } from "@rdx/ui";
import { hasPermission, isAdminUser, P } from "../../../lib/permissions";
import { useMe } from "../../../lib/use-me";
import {
  liveChatKeys,
  useDeskAction,
  useDeskConversationDetails,
  useDeskConversations,
  useDeskMe,
  useDeskMembers,
  useMarkRead,
  useUpdateMemberLimit,
  useUpdatePresence,
} from "../../../lib/use-live-chat";
import type { DeskAction } from "../../../lib/live-chat-api";
import { setDeskTyping } from "../../../lib/live-chat-api";
import {
  assigneeId,
  canSeeConversation,
  canTakeConversation,
  matchesInbox,
  MAX_QUEUE_LIMIT,
  memberName,
  MIN_QUEUE_LIMIT,
} from "./assignment";
import ConversationList from "./ConversationList";
import type { ChatActivity } from "./desk-feedback";
import TransferDialog from "./TransferDialog";
import ConversationThread from "./ConversationThread";
import CustomerContext from "./CustomerContext";
import FloatingChatWindow from "./FloatingChatWindow";
import {
  CUSTOMER_PANEL_WIDTH,
  MAX_FLOATING_CHATS,
  closeOpenChat,
  collapseFloat,
  createOpenChatSession,
  expandFloat,
  floatingIds as sessionFloatingIds,
  layoutFloats,
  openChat,
  openChatInMain,
  pruneOpenChats,
  retainFloats,
  type OpenChatSession,
} from "./open-chats";
import TeamAnalytics from "./TeamAnalytics";
import type { ComposerMode, LiveConversation, QueueFilter } from "./types";

const LIMIT_SAVE_DELAY_MS = 600;
const INBOX_ORDER: QueueFilter[] = ["active", "user_queue", "team", "closed"];

function clampLimit(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.min(MAX_QUEUE_LIMIT, Math.max(MIN_QUEUE_LIMIT, Math.round(value)));
}

function useWideScreen() {
  const query = "(min-width: 1280px)";
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return matches;
}

/** List rows own status and assignment. Loaded details add the transcript. */
function mergeConversations(rows: LiveConversation[], details: Map<string, LiveConversation>) {
  const merged = rows.map((row) => {
    const detail = details.get(row.id);
    return detail ? { ...row, messages: detail.messages, messagesLoaded: true } : row;
  });
  const listed = new Set(rows.map((row) => row.id));
  for (const detail of details.values()) if (!listed.has(detail.id)) merged.push(detail);
  return merged;
}

const idleActivity: ChatActivity = {
  pending: null,
  actionsLocked: false,
  transcriptStatus: "ready",
  onRetryTranscript: () => undefined,
};

export default function LiveChatPage() {
  const queryClient = useQueryClient();
  const me = useMe();
  const user = me.data?.user;
  const agentName = user?.name?.trim() || "You";
  const isDeskAdmin = isAdminUser(user);
  const canAccess = hasPermission(user, P.LIVE_CHAT_ACCESS);
  const canReply = hasPermission(user, P.LIVE_CHAT_REPLY);
  const canAssign = hasPermission(user, P.LIVE_CHAT_ASSIGN);
  const canResolve = hasPermission(user, P.LIVE_CHAT_RESOLVE);
  const isWide = useWideScreen();

  const deskMe = useDeskMe(canAccess);
  const membersQuery = useDeskMembers(canAccess);
  const listQuery = useDeskConversations(canAccess);
  const action = useDeskAction();
  const presence = useUpdatePresence();
  const memberLimit = useUpdateMemberLimit();
  const markRead = useMarkRead();

  const viewerId = deskMe.data ? String(deskMe.data.id) : "";
  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const resolvedTotal = listQuery.data?.resolvedTotal ?? 0;

  const [storedSession, setChatSession] = useState<OpenChatSession>(() => createOpenChatSession());
  const transcripts = useDeskConversationDetails(storedSession.openIds);
  const details = transcripts.byId;
  const pendingAction = action.isPending ? action.variables : null;
  const actionsLocked = Boolean(pendingAction && pendingAction.type !== "message");
  const conversations = useMemo(() => mergeConversations(rows, details), [rows, details]);
  const byId = useMemo(() => new Map(conversations.map((conv) => [conv.id, conv])), [conversations]);

  const [limitDraft, setLimitDraft] = useState<number | null>(null);
  const [memberLimitDrafts, setMemberLimitDrafts] = useState<Record<string, number>>({});
  const limitTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const members = useMemo(
    () =>
      (membersQuery.data ?? []).map((member) =>
        member.id in memberLimitDrafts ? { ...member, limit: memberLimitDrafts[member.id] } : member,
      ),
    [membersQuery.data, memberLimitDrafts],
  );
  const queueLimit = limitDraft ?? deskMe.data?.limit ?? 6;
  const accepting = deskMe.data?.accepting ?? false;
  const canChangePresence = canAssign && Boolean(deskMe.data?.canReceiveChats);

  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const loaded = Boolean(listQuery.data && deskMe.data);
  const canFloat = (chatId: string) => {
    const conv = byId.get(chatId);
    return Boolean(conv && matchesInbox(conv, "active", viewerId, isDeskAdmin));
  };
  const chatSession = loaded
    ? retainFloats(
        pruneOpenChats(storedSession, (id) => {
          const conv = byId.get(id);
          return Boolean(conv && canSeeConversation(conv, isDeskAdmin, viewerId));
        }),
        canFloat,
      )
    : storedSession;
  if (chatSession !== storedSession) {
    setChatSession(chatSession);
    if (chatSession.mainId === null) setShowThreadOnMobile(false);
  }
  const selectedId = chatSession.mainId;
  const openChatIds = chatSession.openIds;
  const [filter, setFilter] = useState<QueueFilter>("active");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(isWide);
  const [threadFocusToken, setThreadFocusToken] = useState(0);
  const [announcement, setAnnouncement] = useState({ id: 0, text: "" });
  const [deskView, setDeskView] = useState<"chats" | "team">("chats");
  const [transferOpen, setTransferOpen] = useState(false);
  /** When transferring from a floating chat, track which conversation is being transferred. */
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);

  const queueFilter: QueueFilter = !isDeskAdmin && filter === "team" ? "user_queue" : filter;

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;
  const visibleSelected = selected && canSeeConversation(selected, isDeskAdmin, viewerId) ? selected : null;
  const selectedAssignee = visibleSelected ? memberName(members, assigneeId(visibleSelected)) : null;

  const floatingIds = sessionFloatingIds(chatSession);
  const deskRef = useRef<HTMLDivElement>(null);
  const [deskWidth, setDeskWidth] = useState(() => window.innerWidth);
  const narrowDesk = deskWidth < 768;

  const announce = (text: string) => {
    setAnnouncement((current) => ({ id: current.id + 1, text }));
  };

  const confirm = (text: string) => {
    announce(text);
    toast.success(text);
  };

  const chatActivity = (conversation: LiveConversation): ChatActivity => ({
    pending: pendingAction?.id === conversation.id ? pendingAction : null,
    actionsLocked,
    transcriptStatus: conversation.messagesLoaded
      ? "ready"
      : transcripts.failedIds.has(conversation.id)
        ? "error"
        : "loading",
    onRetryTranscript: () => {
      void queryClient.invalidateQueries({ queryKey: liveChatKeys.conversation(conversation.id) });
    },
  });

  const closeChat = (id: string) => {
    const next = closeOpenChat(chatSession, id);
    setChatSession(next);
    if (chatSession.mainId === id && next.mainId === null) setShowThreadOnMobile(false);
    if (chatSession.mainId === id && next.mainId) setThreadFocusToken((token) => token + 1);
    setTransferOpen(false);
    if (transferTargetId === id) setTransferTargetId(null);
  };

  const openConversation = (id: string, options?: { openThread?: boolean; focusThread?: boolean }) => {
    setTransferOpen(false);
    setDeskView("chats");

    const floatAllowed = queueFilter === "active" && canFloat(id);
    if (!floatAllowed) {
      const alreadyFloating = new Set(sessionFloatingIds(chatSession));
      const next = openChatInMain(chatSession, id, (chatId) => alreadyFloating.has(chatId) && canFloat(chatId));
      setChatSession(next);
      if (options?.openThread !== false) {
        setShowThreadOnMobile(true);
        if (options?.focusThread || narrowDesk) setThreadFocusToken((token) => token + 1);
      }
      return;
    }

    const promote =
      narrowDesk ||
      options?.focusThread === true ||
      chatSession.openIds.includes(id) ||
      chatSession.mainId === null ||
      (chatSession.mainId !== null && !canFloat(chatSession.mainId));
    const result = openChat(chatSession, id, { promote });
    if (result.status === "limit") {
      const text = `Max ${MAX_FLOATING_CHATS} side chats allowed.`;
      announce(text);
      toast.info(text);
      return;
    }

    const next = retainFloats(result.session, canFloat);
    setChatSession(next);
    if (result.status === "floated" && next.openIds.includes(id) && next.mainId !== id) {
      announce(`${byId.get(id)?.customerName ?? "Chat"} is open in a side window.`);
      return;
    }

    if (next.mainId === id && options?.openThread !== false) {
      setShowThreadOnMobile(true);
      if (options?.focusThread || narrowDesk) setThreadFocusToken((token) => token + 1);
    }
  };

  /** Move a side window into the main panel. The previous main chat becomes a side window. */
  const focusChat = (id: string) => {
    setChatSession(retainFloats(openChat(chatSession, id, { promote: true }).session, canFloat));
    setDeskView("chats");
    setShowThreadOnMobile(true);
    setThreadFocusToken((token) => token + 1);
  };

  const run = (deskAction: DeskAction, onDone: (conv: LiveConversation | null) => void) => {
    if (actionsLocked) return;
    action.mutate(deskAction, {
      onSuccess: (result) => {
        if (result.type === "conversation") onDone(result.conversation);
      },
    });
  };

  const takeChat = (id: string) => {
    const conv = byId.get(id);
    if (!conv || !canTakeConversation(conv, viewerId, isDeskAdmin, canAssign)) return;
    run({ type: "take", id }, () => {
      setFilter("active");
      setDeskView("chats");
      confirm(`You took the chat with ${conv.customerName}.`);
    });
  };

  const transferChat = (memberId: string, conversationId?: string) => {
    const id = conversationId ?? transferTargetId ?? selectedId;
    const conv = id ? byId.get(id) : undefined;
    if (!id || !conv || !canAssign || conv.status !== "active" || conv.ownerId !== viewerId) return;
    const target = members.find((member) => member.id === memberId);
    if (!target || target.id === viewerId) return;
    run({ type: "transfer", id, memberId }, () => {
      setFilter(isDeskAdmin ? "team" : "active");
      confirm(`Transferred ${conv.customerName} to ${target.name}.`);
      setTransferOpen(false);
      setTransferTargetId(null);
    });
  };

  const resolveChat = (id: string) => {
    const conv = byId.get(id);
    if (!conv || !canResolve || conv.status !== "active" || conv.ownerId !== viewerId) return;
    run({ type: "resolve", id }, () => {
      setFilter("closed");
      confirm(`Closed the chat with ${conv.customerName}.`);
    });
  };

  const typingState = useRef(
    new Map<
      string,
      {
        active: boolean;
        canResend: boolean;
        idleTimer: number | null;
        cooldownTimer: number | null;
      }
    >(),
  );
  const reportTyping = (id: string, active: boolean) => {
    const current = typingState.current.get(id) ?? {
      active: false,
      canResend: true,
      idleTimer: null,
      cooldownTimer: null,
    };
    if (active) {
      if (!current.active || current.canResend) {
        current.active = true;
        current.canResend = false;
        if (current.cooldownTimer !== null) window.clearTimeout(current.cooldownTimer);
        current.cooldownTimer = window.setTimeout(() => {
          current.canResend = true;
          current.cooldownTimer = null;
        }, 10_000);
        setDeskTyping(id, true);
      }
      if (current.idleTimer !== null) window.clearTimeout(current.idleTimer);
      current.idleTimer = window.setTimeout(() => {
        current.active = false;
        current.idleTimer = null;
        setDeskTyping(id, false);
      }, 3_000);
    } else if (current.active) {
      if (current.idleTimer !== null) window.clearTimeout(current.idleTimer);
      current.active = false;
      current.idleTimer = null;
      setDeskTyping(id, false);
    }
    typingState.current.set(id, current);
  };

  const sendReply = (id: string, mode: ComposerMode) => {
    const conv = byId.get(id);
    if (!conv || !canReply || conv.status === "resolved") return;
    if (mode === "reply" && (conv.status !== "active" || conv.ownerId !== viewerId)) return;
    const body = (drafts[id] ?? "").trim();
    if (!body || body.startsWith("/")) return;
    const localId = `local-${crypto.randomUUID()}`;
    reportTyping(id, false);
    setDrafts((current) => ({ ...current, [id]: "" }));
    action.mutate(
      { type: "message", id, kind: mode, body, localId, authorName: deskMe.data?.name ?? "You" },
      {
        onError: () => setDrafts((current) => ({ ...current, [id]: body })),
      },
    );
  };

  const scheduleLimit = (key: string, save: () => void) => {
    const timers = limitTimers.current;
    const pending = timers.get(key);
    if (pending) clearTimeout(pending);
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        save();
      }, LIMIT_SAVE_DELAY_MS),
    );
  };

  const changeOwnLimit = (raw: number) => {
    const limit = clampLimit(raw);
    if (limit === null || !canChangePresence) return;
    setLimitDraft(limit);
    scheduleLimit("me", () => {
      presence.mutate({ limit });
      setLimitDraft(null);
      announce(`You can now hold ${limit} chats in Active, including owned and waiting.`);
    });
  };

  const changeMemberLimit = (memberId: string, raw: number) => {
    const limit = clampLimit(raw);
    if (limit === null || !isDeskAdmin) return;
    setMemberLimitDrafts((current) => ({ ...current, [memberId]: limit }));
    scheduleLimit(memberId, () => {
      memberLimit.mutate(
        { memberId, limit },
        {
          onSettled: () =>
            setMemberLimitDrafts((current) => {
              const next = { ...current };
              delete next[memberId];
              return next;
            }),
        },
      );
      announce(`${memberName(members, memberId)} can now hold ${limit} chats in Active.`);
    });
  };

  const changeAccepting = (nextAccepting: boolean) => {
    if (!canChangePresence) return;
    presence.mutate(
      { accepting: nextAccepting },
      {
        onSuccess: () =>
          toast.success(nextAccepting ? "You are online for new chats." : "You are offline for new chats."),
      },
    );
    announce(
      nextAccepting
        ? "You are accepting new handoffs. Open slots in Active fill from the oldest waiting chats."
        : "You are not accepting new handoffs. Waiting chats left your Active tab.",
    );
  };

  useEffect(() => {
    const timers = limitTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const linkedChatId = searchParams.get("chat");
  const [openedLink, setOpenedLink] = useState<string | null>(null);
  const linkedChat = linkedChatId ? byId.get(linkedChatId) : undefined;
  const linkUsable = Boolean(linkedChat && canSeeConversation(linkedChat, isDeskAdmin, viewerId));
  if (!linkedChatId && openedLink !== null) setOpenedLink(null);
  if (loaded && linkedChat && linkUsable && openedLink !== linkedChat.id) {
    setOpenedLink(linkedChat.id);
    const inbox = INBOX_ORDER.find((item) => matchesInbox(linkedChat, item, viewerId, isDeskAdmin));
    if (inbox) setFilter(inbox);
    openConversation(linkedChat.id, { openThread: true, focusThread: true });
  }
  useEffect(() => {
    if (!linkedChatId || !loaded) return;
    if (!linkUsable) toast.info("That chat is no longer available to you.");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("chat");
        return next;
      },
      { replace: true },
    );
  }, [linkedChatId, linkUsable, loaded, setSearchParams]);

  useEffect(() => {
    if (!detailsOpen || isWide) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailsOpen, isWide]);

  useLayoutEffect(() => {
    const node = deskRef.current;
    if (!node) return;
    const measure = () => setDeskWidth(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [loaded]);

  const transferConversation =
    (transferTargetId ? byId.get(transferTargetId) : visibleSelected) ?? null;

  const detailsDocked = deskView === "chats" && detailsOpen && isWide && Boolean(visibleSelected);
  const detailsModal = deskView === "chats" && detailsOpen && !isWide && Boolean(visibleSelected);
  const floatWidth = Math.max(0, deskWidth - (detailsDocked ? CUSTOMER_PANEL_WIDTH : 0) - 24);
  const floatLayout = layoutFloats(floatingIds, new Set(chatSession.collapsedIds), floatWidth, narrowDesk);
  const mainVisible = deskView === "chats" && (!narrowDesk || showThreadOnMobile);
  const floatsVisible = deskView === "chats" && queueFilter === "active" && !detailsModal && !transferOpen;
  const watching = [
    mainVisible ? selectedId : null,
    ...(floatsVisible ? floatLayout.filter((item) => !item.minimized).map((item) => item.id) : []),
  ].filter((id): id is string => Boolean(id));
  const unreadWatched = watching.filter((id) => (byId.get(id)?.unread ?? 0) > 0).join("|");

  const { mutate: markReadMutate } = markRead;
  useEffect(() => {
    for (const id of unreadWatched.split("|").filter(Boolean)) markReadMutate(id);
  }, [unreadWatched, markReadMutate]);

  const toggleFloat = (id: string) => {
    const item = floatLayout.find((entry) => entry.id === id);
    if (!item || narrowDesk) return;
    setChatSession(
      item.minimized
        ? expandFloat(chatSession, id, floatWidth, false)
        : collapseFloat(chatSession, id),
    );
  };

  if (!canAccess) {
    return <DeskMessage text="You do not have access to live chat." />;
  }
  if (listQuery.isError || deskMe.isError) {
    return (
      <DeskMessage
        text="Live chat could not load."
        action={{
          label: "Try again",
          onClick: () => {
            void deskMe.refetch();
            void listQuery.refetch();
            void membersQuery.refetch();
          },
        }}
      />
    );
  }
  if (!loaded) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center" role="status">
        <LoaderCircleIcon className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" />
        <span className="sr-only">Loading live chat</span>
      </div>
    );
  }

  return (
    <div ref={deskRef} className="live-chat relative -m-4 flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-white">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        <span key={announcement.id}>{announcement.text}</span>
      </div>

      <div className={cn("h-full min-h-0", showThreadOnMobile ? "hidden md:flex" : "flex")}>
        <div className="flex h-full min-h-0 shrink-0 flex-col">
          {isDeskAdmin ? (
            <div className="flex items-center gap-1 border-r border-b border-slate-200 bg-white px-3 py-2">
              <ViewTab active={deskView === "chats"} onClick={() => setDeskView("chats")} label="Chats" />
              <ViewTab active={deskView === "team"} onClick={() => setDeskView("team")} label="Team" />
            </div>
          ) : null}
          <div className="min-h-0 flex-1">
            <ConversationList
              conversations={conversations}
              selectedId={visibleSelected?.id ?? null}
              openChatIds={openChatIds}
              filter={queueFilter}
              query={query}
              accepting={accepting}
              isDeskAdmin={isDeskAdmin}
              viewerId={viewerId}
              members={members}
              queueLimit={queueLimit}
              canChangePresence={canChangePresence}
              onFilter={(next) => {
                setFilter(next);
                setDeskView("chats");
              }}
              onQuery={setQuery}
              onAccepting={changeAccepting}
              onLimit={changeOwnLimit}
              dockInset={floatLayout.length > 0}
              refreshing={listQuery.isFetching}
              presencePending={presence.isPending}
              busyId={pendingAction?.id ?? null}
              loadingIds={transcripts.loadingIds}
              onSelect={openConversation}
            />
          </div>
        </div>
      </div>

      <div className={cn("h-full min-h-0 min-w-0 flex-1", showThreadOnMobile || deskView === "team" ? "flex" : "hidden md:flex")}>
        {deskView === "team" && isDeskAdmin ? (
          <TeamAnalytics
            members={members}
            conversations={conversations}
            resolvedTotal={resolvedTotal}
            onLimit={changeMemberLimit}
          />
        ) : (
          <ConversationThread
            conversation={visibleSelected}
            agentName={agentName}
            draft={visibleSelected ? (drafts[visibleSelected.id] ?? "") : ""}
            canReply={canReply}
            canAssign={canAssign}
            canResolve={canResolve}
            allowTake={Boolean(
              visibleSelected && canTakeConversation(visibleSelected, viewerId, isDeskAdmin, canAssign),
            )}
            viewerId={viewerId}
            assigneeName={selectedAssignee}
            detailsOpen={detailsOpen}
            focusToken={threadFocusToken}
            onDraft={(value) => {
              if (!visibleSelected) return;
              setDrafts((current) => ({ ...current, [visibleSelected.id]: value }));
              reportTyping(visibleSelected.id, value.trim().length > 0 && !value.trim().startsWith("/"));
            }}
            onSend={(mode) => {
              if (visibleSelected) sendReply(visibleSelected.id, mode);
            }}
            onTake={() => {
              if (visibleSelected) takeChat(visibleSelected.id);
            }}
            onResolve={() => {
              if (visibleSelected) resolveChat(visibleSelected.id);
            }}
            onOpenTransfer={() => {
              if (visibleSelected) {
                setTransferTargetId(visibleSelected.id);
                setTransferOpen(true);
              }
            }}
            onBack={() => setShowThreadOnMobile(false)}
            onOpenDetails={() => setDetailsOpen((open) => !open)}
            onCloseChat={
              visibleSelected
                ? () => closeChat(visibleSelected.id)
                : undefined
            }
            activity={visibleSelected ? chatActivity(visibleSelected) : { ...idleActivity, actionsLocked }}
          />
        )}
      </div>

      {deskView === "chats" && detailsOpen && visibleSelected ? (
        <>
          {isWide ? null : (
            <button
              type="button"
              className="absolute inset-0 z-10 cursor-pointer bg-slate-900/40"
              aria-label="Close customer details"
              onClick={() => setDetailsOpen(false)}
            />
          )}
          <div className={cn("z-20 flex h-full", isWide ? "static" : "absolute inset-y-0 right-0 shadow-xl")}>
            <CustomerContext
              conversation={visibleSelected}
              assigneeName={selectedAssignee}
              modal={!isWide}
              onClose={() => setDetailsOpen(false)}
              onAnnounce={announce}
            />
          </div>
        </>
      ) : null}

      {transferOpen && transferConversation ? (
        <TransferDialog
          customerName={transferConversation.customerName}
          members={members.filter((member) => member.id !== viewerId)}
          pendingMemberId={
            pendingAction?.type === "transfer" && pendingAction.id === transferConversation.id
              ? pendingAction.memberId
              : null
          }
          onClose={() => {
            setTransferOpen(false);
            setTransferTargetId(null);
          }}
          onTransfer={(memberId) => {
            transferChat(memberId, transferConversation.id);
          }}
        />
      ) : null}

      {floatsVisible && floatLayout.length > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-end px-3 pb-3"
          style={detailsDocked ? { right: CUSTOMER_PANEL_WIDTH } : undefined}
        >
          <div
            className="pointer-events-auto flex w-max max-w-full items-end gap-3 overflow-x-auto overscroll-x-contain"
            role="region"
            aria-label="Side chats"
          >
          {floatLayout.map((item) => {
            const conv = byId.get(item.id);
            if (!conv || !matchesInbox(conv, "active", viewerId, isDeskAdmin)) return null;
            return (
              <FloatingChatWindow
                key={conv.id}
                conversation={conv}
                agentName={agentName}
                draft={drafts[conv.id] ?? ""}
                canReply={canReply}
                canAssign={canAssign}
                canResolve={canResolve}
                allowTake={canTakeConversation(conv, viewerId, isDeskAdmin, canAssign)}
                viewerId={viewerId}
                assigneeName={memberName(members, assigneeId(conv))}
                minimized={item.minimized}
                compactOnly={narrowDesk}
                onDraft={(value) => {
                  setDrafts((current) => ({ ...current, [conv.id]: value }));
                  reportTyping(conv.id, value.trim().length > 0 && !value.trim().startsWith("/"));
                }}
                onSend={(mode) => sendReply(conv.id, mode)}
                onTake={() => takeChat(conv.id)}
                onResolve={() => resolveChat(conv.id)}
                onOpenTransfer={() => {
                  setTransferTargetId(conv.id);
                  setTransferOpen(true);
                }}
                onFocus={() => focusChat(conv.id)}
                onToggleMinimized={() => toggleFloat(conv.id)}
                onClose={() => closeChat(conv.id)}
                activity={chatActivity(conv)}
              />
            );
          })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DeskMessage({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-slate-700">{text}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

function ViewTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {label}
    </button>
  );
}
