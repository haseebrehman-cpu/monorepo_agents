import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@rdx/ui";
import { hasPermission, isAdminUser, P } from "../../../lib/permissions";
import { useMe } from "../../../lib/use-me";
import {
  assigneeId,
  canSeeConversation,
  createSupportTeam,
  MAX_QUEUE_LIMIT,
  memberName,
  MIN_QUEUE_LIMIT,
  rebalance,
  SUPPORT_ADMIN_ID,
  VIEWER_ID,
} from "./assignment";
import ConversationList from "./ConversationList";
import TransferDialog from "./TransferDialog";
import ConversationThread from "./ConversationThread";
import CustomerContext from "./CustomerContext";
import FloatingChatWindow from "./FloatingChatWindow";
import {
  CUSTOMER_PANEL_WIDTH,
  MAX_OPEN_CHATS,
  closeOpenChat,
  collapseFloat,
  createOpenChatSession,
  expandFloat,
  floatingIds as sessionFloatingIds,
  layoutFloats,
  openChat,
  pruneOpenChats,
  type OpenChatSession,
} from "./open-chats";
import { createIncomingHandoff, createSampleConversations } from "./sample-conversations";
import TeamAnalytics from "./TeamAnalytics";
import type { ChatMessage, ComposerMode, LiveConversation, QueueFilter, SupportMember } from "./types";
import { toast } from "react-toastify";

function withMessage(conversation: LiveConversation, message: ChatMessage): LiveConversation {
  return {
    ...conversation,
    updatedAt: message.at,
    typing: false,
    messages: [...conversation.messages, message],
  };
}

function markWatchedRead(conversations: LiveConversation[], watching: ReadonlySet<string>): LiveConversation[] {
  let changed = false;
  const next = conversations.map((conversation) => {
    if (!watching.has(conversation.id) || conversation.unread === 0) return conversation;
    changed = true;
    return { ...conversation, unread: 0 };
  });
  return changed ? next : conversations;
}

function clampLimit(value: number) {
  if (!Number.isFinite(value)) return null;
  return Math.min(MAX_QUEUE_LIMIT, Math.max(MIN_QUEUE_LIMIT, Math.round(value)));
}

function syncSupportTeam(members: SupportMember[], agentName: string, isDeskAdmin: boolean): SupportMember[] {
  const named = members
    .filter((member) => member.id !== SUPPORT_ADMIN_ID || !isDeskAdmin)
    .map((member) =>
      member.id === VIEWER_ID
        ? { ...member, name: agentName, role: isDeskAdmin ? ("admin" as const) : ("agent" as const) }
        : member,
    );
  if (isDeskAdmin || named.some((member) => member.id === SUPPORT_ADMIN_ID)) return named;
  return [
    ...named,
    { id: SUPPORT_ADMIN_ID, name: "Rania Osman", role: "admin", limit: 6, accepting: true },
  ];
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

export default function LiveChatPage() {
  const me = useMe();
  const user = me.data?.user;
  const agentName = user?.name?.trim() || "You";
  const isDeskAdmin = isAdminUser(user);
  const canReply = hasPermission(user, P.LIVE_CHAT_REPLY);
  const canAssign = hasPermission(user, P.LIVE_CHAT_ASSIGN);
  const canResolve = hasPermission(user, P.LIVE_CHAT_RESOLVE);
  const isWide = useWideScreen();

  const [memberState, setMembers] = useState<SupportMember[]>(() => createSupportTeam(agentName));
  const [conversations, setConversations] = useState(() => rebalance(createSampleConversations(), createSupportTeam(agentName)));
  const [storedSession, setChatSession] = useState<OpenChatSession>(() => createOpenChatSession("lc-10482"));
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const chatSession = pruneOpenChats(storedSession, (id) => {
    const conv = conversations.find((item) => item.id === id);
    return Boolean(conv && canSeeConversation(conv, isDeskAdmin, VIEWER_ID));
  });
  if (chatSession !== storedSession) {
    setChatSession(chatSession);
    if (chatSession.mainId === null) setShowThreadOnMobile(false);
  }
  const selectedId = chatSession.mainId;
  const openChatIds = chatSession.openIds;
  const [filter, setFilter] = useState<QueueFilter>("user_queue");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [detailsOpen, setDetailsOpen] = useState(isWide);
  const [threadFocusToken, setThreadFocusToken] = useState(0);
  const [announcement, setAnnouncement] = useState({ id: 0, text: "" });
  const [deskView, setDeskView] = useState<"chats" | "team">("chats");
  const [transferOpen, setTransferOpen] = useState(false);
  /** When transferring from a floating chat, track which conversation is being transferred. */
  const [transferTargetId, setTransferTargetId] = useState<string | null>(null);
  const [seenWatchingKey, setSeenWatchingKey] = useState<string | null>(null);

  const members = useMemo(
    () => syncSupportTeam(memberState, agentName, isDeskAdmin),
    [memberState, agentName, isDeskAdmin],
  );
  const queueFilter: QueueFilter = !isDeskAdmin && filter === "team" ? "user_queue" : filter;
  const viewer = members.find((member) => member.id === VIEWER_ID);
  const queueLimit = viewer?.limit ?? 6;
  const accepting = viewer?.accepting ?? true;

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const visibleSelected = selected && canSeeConversation(selected, isDeskAdmin, VIEWER_ID) ? selected : null;
  const selectedAssignee = visibleSelected ? memberName(members, assigneeId(visibleSelected)) : null;

  const floatingIds = useMemo(() => sessionFloatingIds(chatSession), [chatSession]);
  const deskRef = useRef<HTMLDivElement>(null);
  const [deskWidth, setDeskWidth] = useState(() => window.innerWidth);
  const narrowDesk = deskWidth < 768;

  const announce = (text: string) => {
    setAnnouncement((current) => ({ id: current.id + 1, text }));
  };

  const updateSelected = (id: string, change: (conversation: LiveConversation) => LiveConversation) => {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? change(conversation) : conversation)),
    );
  };

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

    const promote =
      narrowDesk ||
      options?.focusThread === true ||
      chatSession.openIds.includes(id) ||
      chatSession.mainId === null;
    const result = openChat(chatSession, id, { promote });
    if (result.status === "limit") {
      const text = `You can have at most ${MAX_OPEN_CHATS} chats open. Close one to open another.`;
      announce(text);
      toast.info(text);
      return;
    }

    setChatSession(result.session);
    if (result.status === "floated") {
      const conv = conversations.find((conversation) => conversation.id === id);
      announce(`${conv?.customerName ?? "Chat"} is open in a side window.`);
      return;
    }

    if (result.session.mainId === id && options?.openThread !== false) {
      setShowThreadOnMobile(true);
      if (options?.focusThread || narrowDesk) setThreadFocusToken((token) => token + 1);
    }
  };

  /** Move a side window into the main panel. The previous main chat becomes a side window. */
  const focusChat = (id: string) => {
    setChatSession(openChat(chatSession, id, { promote: true }).session);
    setDeskView("chats");
    setShowThreadOnMobile(true);
    setThreadFocusToken((token) => token + 1);
  };

  const replaceConversation = (id: string, next: LiveConversation, thenRebalance = false) => {
    setConversations((current) => {
      const mapped = current.map((conversation) => (conversation.id === id ? next : conversation));
      return thenRebalance ? rebalance(mapped, members) : mapped;
    });
  };

  const takeChat = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canAssign || conv.status !== "waiting") return;
    if (conv.queuedForId !== VIEWER_ID) return;
    if (!canSeeConversation(conv, isDeskAdmin, VIEWER_ID)) return;
    const at = new Date().toISOString();
    replaceConversation(
      id,
      withMessage(
        { ...conv, status: "active", ownerId: VIEWER_ID, queuedForId: null },
        {
          id: `join-${at}`,
          author: "system",
          authorName: "System",
          body: `${agentName} took this conversation.`,
          at,
        },
      ),
      true,
    );
    setFilter("active");
    setDeskView("chats");
    announce(`You took the conversation with ${conv.customerName}. Only you can see it now.`);
  };

  const transferChat = (memberId: string, conversationId?: string) => {
    const id = conversationId ?? transferTargetId ?? selectedId;
    if (!id) return;
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canAssign || conv.status !== "active" || conv.ownerId !== VIEWER_ID) return;
    const target = members.find((member) => member.id === memberId);
    if (!target || target.id === VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      id,
      withMessage(
        { ...conv, ownerId: target.id, queuedForId: null },
        {
          id: `xfer-${at}`,
          author: "system",
          authorName: "System",
          body: `${agentName} transferred this chat to ${target.name}.`,
          at,
        },
      ),
    );
    setFilter(isDeskAdmin ? "team" : "active");
    announce(`Chat with ${conv.customerName} transferred to ${target.name}.`);
    setTransferOpen(false);
    setTransferTargetId(null);
  };

  const leaveChat = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canAssign || conv.ownerId !== VIEWER_ID || conv.status !== "active") return;
    const at = new Date().toISOString();
    const released = withMessage(
      { ...conv, status: "waiting", ownerId: null, queuedForId: null },
      {
        id: `left-${at}`,
        author: "system",
        authorName: "System",
        body: `${agentName} put this conversation back in the queue.`,
        at,
      },
    );
    setConversations((current) => {
      const next = rebalance(
        current.map((conversation) => (conversation.id === released.id ? released : conversation)),
        members,
      );
      const placed = next.find((conversation) => conversation.id === released.id);
      const queuedName = memberName(members, placed?.queuedForId ?? null);
      announce(
        queuedName
          ? `You released ${conv.customerName}. The handoff is now queued for ${queuedName}.`
          : `You released ${conv.customerName}. No one has an open queue slot.`,
      );
      return next;
    });
    setFilter("user_queue");
  };

  const resolveChat = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canResolve || conv.status !== "active" || conv.ownerId !== VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      id,
      withMessage(
        { ...conv, status: "resolved" },
        {
          id: `resolved-${at}`,
          author: "system",
          authorName: "System",
          body: `Conversation closed by ${agentName}.`,
          at,
        },
      ),
    );
    setFilter("closed");
    announce(`Conversation with ${conv.customerName} closed.`);
  };

  const reopenChat = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canAssign || conv.status !== "resolved" || conv.ownerId !== VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      id,
      withMessage(
        { ...conv, status: "active", ownerId: VIEWER_ID, queuedForId: null },
        {
          id: `reopen-${at}`,
          author: "system",
          authorName: "System",
          body: `${agentName} reopened the conversation.`,
          at,
        },
      ),
    );
    setFilter("active");
    announce(`Conversation with ${conv.customerName} reopened. Only you can see it.`);
  };

  const sendReply = (id: string, mode: ComposerMode) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv || !canReply || conv.status === "resolved") return;
    if (mode === "reply" && conv.ownerId !== VIEWER_ID) return;
    const body = (drafts[id] ?? "").trim();
    if (!body || body.startsWith("/")) return;
    const at = new Date().toISOString();
    updateSelected(id, (conversation) =>
      withMessage(conversation, {
        id: `${mode}-${at}`,
        author: mode === "note" ? "note" : "agent",
        authorName: agentName,
        body,
        at,
      }),
    );
    setDrafts((current) => ({ ...current, [id]: "" }));
    announce(
      mode === "note" ? `Private note saved on ${conv.customerName}.` : `Reply sent to ${conv.customerName}.`,
    );
  };

  const changeLimit = (memberId: string, raw: number) => {
    if (!isDeskAdmin && memberId !== VIEWER_ID) return;
    const limit = clampLimit(raw);
    if (limit === null) return;
    const nextMembers = members.map((member) => (member.id === memberId ? { ...member, limit } : member));
    setMembers(nextMembers);
    setConversations(rebalance(conversations, nextMembers));
    announce(`${memberName(nextMembers, memberId)} can now hold ${limit} queued handoffs.`);
  };

  const changeAccepting = (nextAccepting: boolean) => {
    const nextMembers = members.map((member) =>
      member.id === VIEWER_ID ? { ...member, accepting: nextAccepting } : member,
    );
    setMembers(nextMembers);
    setConversations(rebalance(conversations, nextMembers));
    announce(nextAccepting ? "You are accepting new handoffs." : "You are not accepting new handoffs. Your queue was released.");
  };

  const receiveHandoff = () => {
    const incoming = createIncomingHandoff();
    const next = rebalance([...conversations, { ...incoming, queuedForId: null }], members);
    setConversations(next);
    const placed = next.find((conversation) => conversation.id === incoming.id);
    const queuedName = memberName(members, placed?.queuedForId ?? null);
    setFilter("user_queue");
    setDeskView("chats");
    if (placed && (isDeskAdmin || placed.queuedForId === VIEWER_ID)) {
      // Prefer opening as floating if already at capacity of open chats; otherwise openConversation handles it
      openConversation(placed.id, { openThread: true });
    }
    announce(
      queuedName
        ? `${incoming.customerName} was handed off and queued for ${queuedName}.`
        : `${incoming.customerName} is waiting. Every accepting person is at their queue limit.`,
    );
  };

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
  }, []);

  const transferConversation =
    (transferTargetId
      ? conversations.find((c) => c.id === transferTargetId)
      : visibleSelected) ?? null;

  const detailsDocked = deskView === "chats" && detailsOpen && isWide && Boolean(visibleSelected);
  const detailsModal = deskView === "chats" && detailsOpen && !isWide && Boolean(visibleSelected);
  const floatWidth = Math.max(0, deskWidth - (detailsDocked ? CUSTOMER_PANEL_WIDTH : 0) - 24);
  const floatLayout = layoutFloats(floatingIds, new Set(chatSession.collapsedIds), floatWidth, narrowDesk);
  const mainVisible = deskView === "chats" && (!narrowDesk || showThreadOnMobile);
  const floatsVisible = deskView === "chats" && !detailsModal && !transferOpen;
  const watchingKey = [
    mainVisible ? selectedId : null,
    ...(floatsVisible ? floatLayout.filter((item) => !item.minimized).map((item) => item.id) : []),
  ]
    .filter((id): id is string => Boolean(id))
    .join("|");
  if (seenWatchingKey !== watchingKey) {
    setSeenWatchingKey(watchingKey);
    const watching = new Set(watchingKey.split("|").filter(Boolean));
    const read = markWatchedRead(conversations, watching);
    if (read !== conversations) setConversations(read);
  }

  const toggleFloat = (id: string) => {
    const item = floatLayout.find((entry) => entry.id === id);
    if (!item || narrowDesk) return;
    setChatSession(
      item.minimized
        ? expandFloat(chatSession, id, floatWidth, false)
        : collapseFloat(chatSession, id),
    );
  };

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
              <button
                type="button"
                onClick={receiveHandoff}
                className="ml-auto cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                New handoff
              </button>
            </div>
          ) : (
            <div className="flex justify-end border-r border-b border-slate-200 bg-white px-3 py-2">
              <button
                type="button"
                onClick={receiveHandoff}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                New handoff
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <ConversationList
              conversations={conversations}
              selectedId={visibleSelected?.id ?? null}
              openChatIds={openChatIds}
              filter={queueFilter}
              query={query}
              accepting={accepting}
              isDeskAdmin={isDeskAdmin}
              viewerId={VIEWER_ID}
              members={members}
              queueLimit={queueLimit}
              onFilter={(next) => {
                setFilter(next);
                setDeskView("chats");
              }}
              onQuery={setQuery}
              onAccepting={changeAccepting}
              onLimit={(limit) => changeLimit(VIEWER_ID, limit)}
              dockInset={floatLayout.length > 0}
              onSelect={openConversation}
            />
          </div>
        </div>
      </div>

      <div className={cn("h-full min-h-0 min-w-0 flex-1", showThreadOnMobile || deskView === "team" ? "flex" : "hidden md:flex")}>
        {deskView === "team" && isDeskAdmin ? (
          <TeamAnalytics members={members} conversations={conversations} onLimit={changeLimit} />
        ) : (
          <ConversationThread
            conversation={visibleSelected}
            agentName={agentName}
            draft={visibleSelected ? (drafts[visibleSelected.id] ?? "") : ""}
            canReply={canReply}
            canAssign={canAssign}
            canResolve={canResolve}
            viewerId={VIEWER_ID}
            assigneeName={selectedAssignee}
            detailsOpen={detailsOpen}
            focusToken={threadFocusToken}
            onDraft={(value) => {
              if (!visibleSelected) return;
              setDrafts((current) => ({ ...current, [visibleSelected.id]: value }));
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
            onLeave={() => {
              if (visibleSelected) leaveChat(visibleSelected.id);
            }}
            onReopen={() => {
              if (visibleSelected) reopenChat(visibleSelected.id);
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
          members={members.filter((member) => member.id !== VIEWER_ID)}
          onClose={() => {
            setTransferOpen(false);
            setTransferTargetId(null);
          }}
          onTransfer={(memberId) => {
            transferChat(memberId, transferConversation.id);
          }}
        />
      ) : null}

      {deskView === "chats" && !detailsModal && !transferOpen && floatLayout.length > 0 ? (
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
            const conv = conversations.find((conversation) => conversation.id === item.id);
            if (!conv || !canSeeConversation(conv, isDeskAdmin, VIEWER_ID)) return null;
            return (
              <FloatingChatWindow
                key={conv.id}
                conversation={conv}
                agentName={agentName}
                draft={drafts[conv.id] ?? ""}
                canReply={canReply}
                canAssign={canAssign}
                canResolve={canResolve}
                viewerId={VIEWER_ID}
                assigneeName={memberName(members, assigneeId(conv))}
                minimized={item.minimized}
                compactOnly={narrowDesk}
                onDraft={(value) => setDrafts((current) => ({ ...current, [conv.id]: value }))}
                onSend={(mode) => sendReply(conv.id, mode)}
                onTake={() => takeChat(conv.id)}
                onResolve={() => resolveChat(conv.id)}
                onLeave={() => leaveChat(conv.id)}
                onReopen={() => reopenChat(conv.id)}
                onOpenTransfer={() => {
                  setTransferTargetId(conv.id);
                  setTransferOpen(true);
                }}
                onFocus={() => focusChat(conv.id)}
                onToggleMinimized={() => toggleFloat(conv.id)}
                onClose={() => closeChat(conv.id)}
              />
            );
          })}
          </div>
        </div>
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
