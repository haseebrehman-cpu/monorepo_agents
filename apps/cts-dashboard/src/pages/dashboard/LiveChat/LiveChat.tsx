import { useEffect, useMemo, useState } from "react";
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
import { createIncomingHandoff, createSampleConversations } from "./sample-conversations";
import TeamAnalytics from "./TeamAnalytics";
import type { ChatMessage, ComposerMode, LiveConversation, QueueFilter, SupportMember } from "./types";

function withMessage(conversation: LiveConversation, message: ChatMessage): LiveConversation {
  return {
    ...conversation,
    updatedAt: message.at,
    typing: false,
    messages: [...conversation.messages, message],
  };
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
  const [selectedId, setSelectedId] = useState<string | null>("lc-10482");
  const [filter, setFilter] = useState<QueueFilter>("queued");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(isWide);
  const [threadFocusToken, setThreadFocusToken] = useState(0);
  const [announcement, setAnnouncement] = useState({ id: 0, text: "" });
  const [deskView, setDeskView] = useState<"chats" | "team">("chats");
  const [transferOpen, setTransferOpen] = useState(false);

  const members = useMemo(
    () => syncSupportTeam(memberState, agentName, isDeskAdmin),
    [memberState, agentName, isDeskAdmin],
  );
  const queueFilter: QueueFilter = !isDeskAdmin && filter === "team" ? "queued" : filter;
  const viewer = members.find((member) => member.id === VIEWER_ID);
  const queueLimit = viewer?.limit ?? 6;
  const accepting = viewer?.accepting ?? true;

  const selected = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );
  const visibleSelected = selected && canSeeConversation(selected, isDeskAdmin, VIEWER_ID) ? selected : null;
  const selectedAssignee = visibleSelected ? memberName(members, assigneeId(visibleSelected)) : null;

  const announce = (text: string) => {
    setAnnouncement((current) => ({ id: current.id + 1, text }));
  };

  const updateSelected = (id: string, change: (conversation: LiveConversation) => LiveConversation) => {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? change(conversation) : conversation)),
    );
  };

  const openConversation = (id: string, options?: { openThread?: boolean; focusThread?: boolean }) => {
    setSelectedId(id);
    setTransferOpen(false);
    setDeskView("chats");
    if (options?.openThread !== false) {
      setShowThreadOnMobile(true);
      const narrow = window.matchMedia("(max-width: 767px)").matches;
      if (options?.focusThread || narrow) {
        setThreadFocusToken((token) => token + 1);
      }
    }
    updateSelected(id, (conversation) =>
      conversation.unread === 0 ? conversation : { ...conversation, unread: 0 },
    );
  };

  const replaceConversation = (id: string, next: LiveConversation, thenRebalance = false) => {
    const mapped = conversations.map((conversation) => (conversation.id === id ? next : conversation));
    setConversations(thenRebalance ? rebalance(mapped, members) : mapped);
  };

  const takeChat = () => {
    if (!visibleSelected || !canAssign || visibleSelected.status !== "waiting") return;
    if (visibleSelected.queuedForId !== VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      visibleSelected.id,
      withMessage(
        { ...visibleSelected, status: "active", ownerId: VIEWER_ID, queuedForId: null },
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
    setFilter("mine");
    setDeskView("chats");
    announce(`You took the conversation with ${visibleSelected.customerName}. Only you can see it now.`);
  };

  const transferChat = (memberId: string) => {
    if (!visibleSelected || !canAssign || visibleSelected.status !== "active" || visibleSelected.ownerId !== VIEWER_ID) return;
    const target = members.find((member) => member.id === memberId);
    if (!target || target.id === VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      visibleSelected.id,
      withMessage(
        { ...visibleSelected, ownerId: target.id, queuedForId: null },
        {
          id: `xfer-${at}`,
          author: "system",
          authorName: "System",
          body: `${agentName} transferred this chat to ${target.name}.`,
          at,
        },
      ),
    );
    setFilter(isDeskAdmin ? "team" : "mine");
    announce(`Chat with ${visibleSelected.customerName} transferred to ${target.name}.`);
  };

  const leaveChat = () => {
    if (!visibleSelected || !canAssign || visibleSelected.ownerId !== VIEWER_ID || visibleSelected.status !== "active") return;
    const at = new Date().toISOString();
    const released = withMessage(
      { ...visibleSelected, status: "waiting", ownerId: null, queuedForId: null },
      {
        id: `left-${at}`,
        author: "system",
        authorName: "System",
        body: `${agentName} put this conversation back in the queue.`,
        at,
      },
    );
    const next = rebalance(
      conversations.map((conversation) => (conversation.id === released.id ? released : conversation)),
      members,
    );
    setConversations(next);
    const placed = next.find((conversation) => conversation.id === released.id);
    const queuedName = memberName(members, placed?.queuedForId ?? null);
    setFilter("queued");
    announce(
      queuedName
        ? `You released ${visibleSelected.customerName}. The handoff is now queued for ${queuedName}.`
        : `You released ${visibleSelected.customerName}. No one has an open queue slot.`,
    );
  };

  const resolveChat = () => {
    if (!visibleSelected || !canResolve || visibleSelected.status !== "active" || visibleSelected.ownerId !== VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      visibleSelected.id,
      withMessage(
        { ...visibleSelected, status: "resolved" },
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
    announce(`Conversation with ${visibleSelected.customerName} closed.`);
  };

  const reopenChat = () => {
    if (!visibleSelected || !canAssign || visibleSelected.status !== "resolved" || visibleSelected.ownerId !== VIEWER_ID) return;
    const at = new Date().toISOString();
    replaceConversation(
      visibleSelected.id,
      withMessage(
        { ...visibleSelected, status: "active", ownerId: VIEWER_ID, queuedForId: null },
        {
          id: `reopen-${at}`,
          author: "system",
          authorName: "System",
          body: `${agentName} reopened the conversation.`,
          at,
        },
      ),
    );
    setFilter("mine");
    announce(`Conversation with ${visibleSelected.customerName} reopened. Only you can see it.`);
  };

  const sendReply = (mode: ComposerMode) => {
    if (!visibleSelected || !canReply || visibleSelected.status === "resolved") return;
    if (mode === "reply" && visibleSelected.ownerId !== VIEWER_ID) return;
    const body = (drafts[visibleSelected.id] ?? "").trim();
    if (!body || body.startsWith("/")) return;
    const at = new Date().toISOString();
    updateSelected(visibleSelected.id, (conversation) =>
      withMessage(conversation, {
        id: `${mode}-${at}`,
        author: mode === "note" ? "note" : "agent",
        authorName: agentName,
        body,
        at,
      }),
    );
    setDrafts((current) => ({ ...current, [visibleSelected.id]: "" }));
    announce(
      mode === "note" ? `Private note saved on ${visibleSelected.customerName}.` : `Reply sent to ${visibleSelected.customerName}.`,
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
    setFilter("queued");
    setDeskView("chats");
    if (placed && (isDeskAdmin || placed.queuedForId === VIEWER_ID)) setSelectedId(placed.id);
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

  return (
    <div className="live-chat relative -m-4 flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-white">
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
            onSend={sendReply}
            onTake={takeChat}
            onResolve={resolveChat}
            onLeave={leaveChat}
            onReopen={reopenChat}
            onOpenTransfer={() => setTransferOpen(true)}
            onBack={() => setShowThreadOnMobile(false)}
            onOpenDetails={() => setDetailsOpen((open) => !open)}
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

      {transferOpen && visibleSelected ? (
        <TransferDialog
          customerName={visibleSelected.customerName}
          members={members.filter((member) => member.id !== VIEWER_ID)}
          onClose={() => setTransferOpen(false)}
          onTransfer={(memberId) => {
            setTransferOpen(false);
            transferChat(memberId);
          }}
        />
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
