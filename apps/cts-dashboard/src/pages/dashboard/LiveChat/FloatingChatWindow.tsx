import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@rdx/ui";
import {
  Maximize2Icon,
  Minimize2Icon,
  PanelRightIcon,
  SendIcon,
  StickyNoteIcon,
  XIcon,
} from "lucide-react";
import { StatusChip } from "./ConversationList";
import { avatarColor, formatMessageTime, formatQueueTime, initials } from "./format";
import type { ChatMessage, ComposerMode, LiveConversation } from "./types";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export default function FloatingChatWindow({
  conversation,
  agentName,
  draft,
  canReply,
  canAssign,
  canResolve,
  viewerId,
  assigneeName,
  minimized,
  compactOnly,
  onDraft,
  onSend,
  onTake,
  onResolve,
  onLeave,
  onReopen,
  onOpenTransfer,
  onFocus,
  onToggleMinimized,
  onClose,
}: {
  conversation: LiveConversation;
  agentName: string;
  draft: string;
  canReply: boolean;
  canAssign: boolean;
  canResolve: boolean;
  viewerId: string;
  assigneeName: string | null;
  minimized: boolean;
  /** Phones keep side chats as pills that open into the main panel. */
  compactOnly: boolean;
  onDraft: (value: string) => void;
  onSend: (mode: ComposerMode) => void;
  onTake: () => void;
  onResolve: () => void;
  onLeave: () => void;
  onReopen: () => void;
  onOpenTransfer: () => void;
  onFocus: () => void;
  onToggleMinimized: () => void;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const ownsChat = conversation.ownerId === viewerId && conversation.status === "active";
  const [modeChoice, setModeChoice] = useState<{
    conversationId: string;
    ownsChat: boolean;
    mode: ComposerMode;
  } | null>(null);
  const mode: ComposerMode =
    modeChoice?.conversationId === conversation.id && modeChoice.ownsChat === ownsChat
      ? modeChoice.mode
      : ownsChat
        ? "reply"
        : "note";
  const setMode = (next: ComposerMode) => {
    setModeChoice({ conversationId: conversation.id, ownsChat, mode: next });
  };
  const canTake = conversation.status === "waiting" && canAssign && conversation.queuedForId === viewerId;
  const canTransfer = ownsChat && canAssign;
  const canLeave = ownsChat && canAssign;
  const canClose = ownsChat && canResolve;
  const canReopen = conversation.status === "resolved" && conversation.ownerId === viewerId && canAssign;
  const noteMode = mode === "note";
  const canCompose = canReply && conversation.status !== "resolved" && (noteMode || ownsChat);
  const canSend = canCompose && draft.trim().length > 0 && !draft.trim().startsWith("/");
  const waited = formatQueueTime(conversation.handedOffAt);

  useEffect(() => {
    if (minimized) {
      pinnedToBottom.current = true;
      return;
    }
    const node = scrollerRef.current;
    if (!node || !pinnedToBottom.current) return;
    node.scrollTop = node.scrollHeight;
  }, [minimized, conversation.messages, conversation.id]);

  const openInMain = () => onFocus();

  return (
    <section
      className={cn(
        "pointer-events-auto flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15",
        minimized ? "h-12 w-60" : "h-[min(70dvh,28rem)] w-[22rem]",
      )}
      role="region"
      aria-label={`Chat with ${conversation.customerName}`}
      aria-expanded={!minimized}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || minimized) return;
        event.stopPropagation();
        onToggleMinimized();
      }}
    >
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 bg-slate-50 px-2.5",
          minimized || compactOnly ? "h-full cursor-pointer" : "border-b border-slate-200 py-2",
          conversation.status === "waiting" && "bg-amber-50",
          conversation.status === "active" && ownsChat && "bg-indigo-50",
        )}
        onClick={() => {
          if (compactOnly || minimized) {
            if (compactOnly) openInMain();
            else onToggleMinimized();
          }
        }}
      >
        <span
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            avatarColor(conversation.customerName),
          )}
          aria-hidden="true"
        >
          {initials(conversation.customerName)}
          {conversation.unread > 0 ? (
            <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-semibold text-white">
              {conversation.unread > 9 ? "9+" : conversation.unread}
            </span>
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-900">{conversation.customerName}</p>
          {minimized ? null : (
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[10px] text-slate-600">
              <StatusChip status={conversation.status} />
              <span className="truncate">
                {conversation.status === "waiting"
                  ? waited === "now"
                    ? "Just queued"
                    : `${waited} in queue`
                  : (assigneeName ?? "Unassigned")}
              </span>
            </p>
          )}
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          {compactOnly ? null : (
            <button
              type="button"
              aria-label={minimized ? `Expand chat with ${conversation.customerName}` : `Minimize chat with ${conversation.customerName}`}
              onClick={onToggleMinimized}
              className={cn(
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-800",
                focusRing,
              )}
            >
              {minimized ? <Maximize2Icon className="h-3.5 w-3.5" /> : <Minimize2Icon className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            aria-label={`Open chat with ${conversation.customerName} in the main panel`}
            onClick={openInMain}
            className={cn(
              "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-800",
              focusRing,
            )}
          >
            <PanelRightIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Close chat with ${conversation.customerName}`}
            onClick={onClose}
            className={cn(
              "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-700",
              focusRing,
            )}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {minimized ? null : (
        <>
          <div
            ref={scrollerRef}
            onScroll={(event) => {
              const node = event.currentTarget;
              pinnedToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
            }}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f4f6f8] px-3 py-3"
          >
            {conversation.messages.map((message) => (
              <FloatingMessage key={message.id} message={message} agentName={agentName} />
            ))}
            {conversation.typing ? (
              <p className="text-[11px] font-medium text-slate-500" role="status">
                {conversation.customerName} is typing…
              </p>
            ) : null}
          </div>

          <footer className="shrink-0 border-t border-slate-200 bg-white p-2">
            {conversation.status === "resolved" ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-600">This chat is closed.</p>
                {canReopen ? (
                  <Button size="sm" variant="outline" className="h-7 cursor-pointer px-2 text-xs" onClick={onReopen}>
                    Reopen
                  </Button>
                ) : null}
              </div>
            ) : conversation.status === "waiting" ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-amber-950">In the queue. Take it before you reply.</p>
                {canTake ? (
                  <Button size="sm" variant="primary" className="h-7 cursor-pointer px-2 text-xs" onClick={onTake}>
                    Take
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1.5">
                {ownsChat ? (
                  <div className="flex flex-wrap gap-1">
                    {canTransfer ? (
                      <Button size="sm" variant="outline" className="h-6 cursor-pointer px-1.5 text-[10px]" onClick={onOpenTransfer}>
                        Transfer
                      </Button>
                    ) : null}
                    {canLeave ? (
                      <Button size="sm" variant="outline" className="h-6 cursor-pointer px-1.5 text-[10px]" onClick={onLeave}>
                        Leave
                      </Button>
                    ) : null}
                    {canClose ? (
                      <Button size="sm" variant="outline" className="h-6 cursor-pointer px-1.5 text-[10px]" onClick={onResolve}>
                        Close
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[10px] leading-4 text-slate-600">
                    {assigneeName ?? "Another person"} has this chat. You can leave a private note.
                  </p>
                )}
                {canReply ? (
                  <form
                    className={cn("rounded-lg border", noteMode ? "border-amber-300 bg-amber-50/50" : "border-slate-200")}
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (canSend) onSend(mode);
                    }}
                  >
                    <div className="flex items-center gap-1 border-b border-slate-100 px-1.5 py-1" role="group" aria-label="Composer mode">
                      <button
                        type="button"
                        aria-pressed={!noteMode}
                        disabled={!ownsChat}
                        onClick={() => setMode("reply")}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          focusRing,
                          !noteMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                          !ownsChat && "cursor-not-allowed opacity-40",
                        )}
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        aria-pressed={noteMode}
                        onClick={() => setMode("note")}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium",
                          focusRing,
                          noteMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        Note
                      </button>
                    </div>
                    <label htmlFor={`float-composer-${conversation.id}`} className="sr-only">
                      {noteMode ? `Private note for ${conversation.customerName}` : `Reply to ${conversation.customerName}`}
                    </label>
                    <textarea
                      id={`float-composer-${conversation.id}`}
                      rows={2}
                      value={draft}
                      onChange={(event) => onDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          if (canSend) onSend(mode);
                        }
                      }}
                      disabled={!canCompose}
                      placeholder={noteMode ? "Private note…" : `Reply to ${conversation.customerName}…`}
                      className={cn(
                        "w-full resize-none border-0 bg-transparent px-2 py-1.5 text-xs leading-5 outline-none placeholder:text-slate-400 disabled:bg-slate-50",
                        noteMode ? "text-amber-950" : "text-slate-900",
                      )}
                    />
                    <div className="flex items-center justify-between px-1.5 pb-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        {noteMode ? <StickyNoteIcon className="h-3 w-3 text-amber-600" aria-hidden="true" /> : null}
                        {noteMode ? "Visible to agents" : "Enter to send"}
                      </span>
                      <Button type="submit" size="sm" variant="primary" className="h-6 cursor-pointer px-2 text-[10px]" disabled={!canSend}>
                        <SendIcon className="h-3 w-3" aria-hidden="true" />
                        {noteMode ? "Save" : "Send"}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            )}
          </footer>
        </>
      )}
    </section>
  );
}

function FloatingMessage({ message, agentName }: { message: ChatMessage; agentName: string }) {
  const name = message.authorName === "You" ? agentName : message.authorName;
  const time = formatMessageTime(message.at);

  if (message.author === "system") {
    return <p className="text-center text-[10px] leading-4 text-slate-500">{message.body}</p>;
  }
  if (message.author === "note") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
        <p className="text-[9px] font-semibold tracking-wide text-amber-800 uppercase">
          Note · {name} · {time}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-amber-950">{message.body}</p>
      </div>
    );
  }
  const isAgent = message.author === "agent";
  return (
    <div className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
      <div className="max-w-[85%]">
        <p className={cn("mb-0.5 text-[9px] font-medium text-slate-500", isAgent && "text-right")}>
          {name} · {time}
        </p>
        <p
          className={cn(
            "px-2.5 py-1.5 text-[11px] leading-4",
            isAgent
              ? "rounded-2xl rounded-br-md bg-indigo-600 text-white"
              : message.author === "assistant"
                ? "rounded-2xl rounded-bl-md bg-slate-200/80 text-slate-800"
                : "rounded-2xl rounded-bl-md bg-white text-slate-900 shadow-sm ring-1 ring-slate-200",
          )}
        >
          {message.body}
        </p>
      </div>
    </div>
  );
}
