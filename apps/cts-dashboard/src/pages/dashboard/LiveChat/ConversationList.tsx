import { useRef, type KeyboardEvent } from "react";
import { cn } from "@rdx/ui";
import { InboxIcon, SearchIcon } from "lucide-react";
import { memberName } from "./assignment";
import { tagById } from "./catalog";
import { avatarColor, formatQueueTime, formatQueueTimeLabel, initials } from "./format";
import type { LiveConversation, QueueFilter, SupportMember } from "./types";

const AGENT_FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "queued", label: "Queued" },
  { id: "mine", label: "Mine" },
  { id: "closed", label: "Closed" },
];

const ADMIN_FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "queued", label: "Incoming" },
  { id: "mine", label: "Mine" },
  { id: "team", label: "Team" },
  { id: "closed", label: "Closed" },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

function matchesFilter(
  conversation: LiveConversation,
  filter: QueueFilter,
  viewerId: string,
  isDeskAdmin: boolean,
) {
  if (filter === "queued") {
    return conversation.status === "waiting" && (isDeskAdmin || conversation.queuedForId === viewerId);
  }
  if (filter === "mine") return conversation.status === "active" && conversation.ownerId === viewerId;
  if (filter === "team") return isDeskAdmin && conversation.status === "active" && conversation.ownerId !== viewerId;
  return conversation.status === "resolved" && (isDeskAdmin || conversation.ownerId === viewerId);
}

function lastPreview(conversation: LiveConversation) {
  const message = [...conversation.messages].reverse().find((entry) => entry.author !== "system");
  if (!message) return "Handed off from the AI assistant";
  if (message.author === "note") return `Note: ${message.body}`;
  return message.body;
}

function optionLabel(conversation: LiveConversation) {
  const unread =
    conversation.unread > 0
      ? `, ${conversation.unread} unread ${conversation.unread === 1 ? "message" : "messages"}`
      : "";
  return `${conversation.customerName}, ${conversation.status}, ${conversation.orderNumber ?? "no order"}, ${lastPreview(conversation)}, updated ${formatQueueTimeLabel(conversation.updatedAt)}${unread}`;
}

export default function ConversationList({
  conversations,
  selectedId,
  filter,
  query,
  accepting,
  isDeskAdmin,
  viewerId,
  members,
  queueLimit,
  onFilter,
  onQuery,
  onAccepting,
  onLimit,
  onSelect,
}: {
  conversations: LiveConversation[];
  selectedId: string | null;
  filter: QueueFilter;
  query: string;
  accepting: boolean;
  isDeskAdmin: boolean;
  viewerId: string;
  members: SupportMember[];
  queueLimit: number;
  onFilter: (filter: QueueFilter) => void;
  onQuery: (query: string) => void;
  onAccepting: (accepting: boolean) => void;
  onLimit: (limit: number) => void;
  onSelect: (id: string, options?: { openThread?: boolean; focusThread?: boolean }) => void;
}) {
  const filters = isDeskAdmin ? ADMIN_FILTERS : AGENT_FILTERS;
  const listRef = useRef<HTMLDivElement>(null);
  const counts = {
    queued: conversations.filter((item) => matchesFilter(item, "queued", viewerId, isDeskAdmin)).length,
    mine: conversations.filter((item) => matchesFilter(item, "mine", viewerId, isDeskAdmin)).length,
    team: conversations.filter((item) => matchesFilter(item, "team", viewerId, isDeskAdmin)).length,
    closed: conversations.filter((item) => matchesFilter(item, "closed", viewerId, isDeskAdmin)).length,
  };

  const term = query.trim().toLowerCase();
  const visible = conversations
    .filter((conversation) => {
      if (!matchesFilter(conversation, filter, viewerId, isDeskAdmin)) return false;
      if (!term) return true;
      const tags = conversation.tags.map((id) => tagById(id)?.label ?? id).join(" ");
      return (
        conversation.customerName.toLowerCase().includes(term) ||
        conversation.customerEmail.toLowerCase().includes(term) ||
        (conversation.orderNumber ?? "").toLowerCase().includes(term) ||
        lastPreview(conversation).toLowerCase().includes(term) ||
        tags.toLowerCase().includes(term)
      );
    })
    .sort((left, right) => {
      if (filter === "queued") {
        return new Date(left.handedOffAt).getTime() - new Date(right.handedOffAt).getTime();
      }
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const moveSelection = (nextIndex: number) => {
    const next = visible[nextIndex];
    if (!next) return;
    onSelect(next.id, { openThread: false });
    listRef.current?.querySelector<HTMLElement>(`#conversation-${next.id}`)?.scrollIntoView({
      block: "nearest",
    });
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (visible.length === 0) return;
    const index = visible.findIndex((item) => item.id === selectedId);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(index === -1 ? 0 : Math.min(visible.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(index === -1 ? 0 : Math.max(0, index - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      moveSelection(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveSelection(visible.length - 1);
    } else if (event.key === "Enter" && index >= 0) {
      event.preventDefault();
      onSelect(visible[index].id, { openThread: true, focusThread: true });
    }
  };

  return (
    <section
      aria-labelledby="live-chat-queue-title"
      className="flex h-full min-h-0 w-full shrink-0 flex-col border-r border-slate-200 bg-white md:w-[22.5rem]"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="live-chat-queue-title" className="text-sm font-semibold text-slate-900">
            Chats
          </h2>
          <button
            type="button"
            role="switch"
            aria-checked={accepting}
            onClick={() => onAccepting(!accepting)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset",
              focusRing,
              accepting
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-slate-200",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", accepting ? "bg-emerald-500" : "bg-slate-400")}
              aria-hidden="true"
            />
            {accepting ? "Accepting" : "Not accepting"}
          </button>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {isDeskAdmin
            ? "Every new handoff is listed here. Your own queue still stops at your limit."
            : counts.queued === 0
              ? `No handoffs in your queue. Your limit is ${queueLimit}.`
              : `${counts.queued} of ${queueLimit} queue ${counts.queued === 1 ? "slot is" : "slots are"} filled. Longest wait is first.`}
        </p>
        <label className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-700">
          Your queue limit
          <input
            type="number"
            min={1}
            max={12}
            value={queueLimit}
            aria-label="Your queue limit"
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              onLimit(next);
            }}
            className={cn(
              "w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-sm text-slate-900",
              focusRing,
            )}
          />
        </label>

        <label htmlFor="live-chat-search" className="sr-only">
          Search conversations by name, email, order, or tag
        </label>
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="live-chat-search"
            type="search"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search name, order, or tag"
            autoComplete="off"
            className={cn(
              "w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-900 transition placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20",
              focusRing,
            )}
          />
        </div>

        <div
          role="tablist"
          aria-label="Chat inboxes"
          className={cn("mt-3 grid gap-1 rounded-lg bg-slate-100 p-1", isDeskAdmin ? "grid-cols-4" : "grid-cols-3")}
        >
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`live-chat-filter-${item.id}`}
                aria-selected={selected}
                aria-controls="live-chat-conversation-list"
                tabIndex={selected ? 0 : -1}
                onClick={() => onFilter(item.id)}
                onKeyDown={(event) => {
                  const index = filters.findIndex((entry) => entry.id === item.id);
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  event.preventDefault();
                  const direction = event.key === "ArrowRight" ? 1 : -1;
                  const next = filters[(index + direction + filters.length) % filters.length];
                  onFilter(next.id);
                  event.currentTarget.parentElement
                    ?.querySelector<HTMLButtonElement>(`#live-chat-filter-${next.id}`)
                    ?.focus();
                }}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  focusRing,
                  selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {item.label}
                <span className={selected ? "text-indigo-700" : "text-slate-500"}>{counts[item.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={listRef}
        id="live-chat-conversation-list"
        role="listbox"
        aria-label="Conversations"
        aria-activedescendant={
          selectedId && visible.some((item) => item.id === selectedId) ? `conversation-${selectedId}` : undefined
        }
        tabIndex={0}
        onKeyDown={onListKeyDown}
        className={cn("min-h-0 flex-1 overflow-y-auto p-2 outline-none", focusRing)}
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <InboxIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-800">No conversations</p>
            <p className="mt-1 text-sm text-slate-600">{term ? "Nothing matches that search." : "This inbox is empty."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((conversation) => {
              const selected = conversation.id === selectedId;
              const waited = formatQueueTime(conversation.handedOffAt);
              const tags = conversation.tags.map((id) => tagById(id)).filter((tag) => tag !== null);
              return (
                <div
                  key={conversation.id}
                  id={`conversation-${conversation.id}`}
                  role="option"
                  aria-selected={selected}
                  aria-label={optionLabel(conversation)}
                  onClick={() => onSelect(conversation.id, { openThread: true })}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-indigo-200 bg-indigo-50/70"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      avatarColor(conversation.customerName),
                    )}
                    aria-hidden="true"
                  >
                    {initials(conversation.customerName)}
                    {conversation.status === "waiting" ? (
                      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    ) : conversation.typing ? (
                      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">{conversation.customerName}</span>
                      <time dateTime={conversation.updatedAt} className="shrink-0 text-[11px] font-medium text-slate-500">
                        {formatQueueTime(conversation.updatedAt)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-xs leading-5 text-slate-600">
                      {conversation.typing ? "Typing…" : lastPreview(conversation)}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <StatusChip status={conversation.status} />
                      {conversation.status === "waiting" ? (
                        <span className="text-[11px] font-medium text-amber-800">
                          {waited === "now" ? "Just queued" : `${waited} in queue`}
                          {isDeskAdmin ? ` · ${memberName(members, conversation.queuedForId) ?? "Unassigned"}` : ""}
                        </span>
                      ) : conversation.status === "active" && conversation.ownerId !== viewerId ? (
                        <span className="truncate text-[11px] text-slate-500">
                          {memberName(members, conversation.ownerId)}
                        </span>
                      ) : null}
                      {tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag.id}
                          className={cn(
                            "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                            tag.className,
                          )}
                        >
                          {tag.label}
                        </span>
                      ))}
                      {conversation.unread > 0 ? (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
                          <span className="sr-only">{conversation.unread} unread</span>
                          <span aria-hidden="true">{conversation.unread}</span>
                        </span>
                      ) : null}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function StatusChip({ status }: { status: LiveConversation["status"] }) {
  const styles = {
    waiting: "bg-amber-50 text-amber-900 ring-amber-200",
    active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    resolved: "bg-slate-100 text-slate-700 ring-slate-200",
  } as const;
  const labels = {
    waiting: "Queued",
    active: "Active",
    resolved: "Closed",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ring-1 ring-inset",
        styles[status],
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "waiting" ? "bg-amber-500" : status === "active" ? "bg-emerald-500" : "bg-slate-400",
        )}
        aria-hidden="true"
      />
      {labels[status]}
    </span>
  );
}
