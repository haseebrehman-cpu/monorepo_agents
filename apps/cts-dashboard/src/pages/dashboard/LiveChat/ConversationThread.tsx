import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, cn } from "@rdx/ui";
import {
  ArrowLeftIcon,
  ArrowRightLeftIcon,
  BookMarkedIcon,
  BotIcon,
  LogOutIcon,
  MessageSquareIcon,
  PanelRightIcon,
  RotateCcwIcon,
  SendIcon,
  StickyNoteIcon,
} from "lucide-react";
import { CANNED, fillCanned } from "./catalog";
import { StatusChip } from "./ConversationList";
import { avatarColor, formatMessageTime, formatQueueTime, initials } from "./format";
import type { ChatMessage, ComposerMode, LiveConversation } from "./types";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

export default function ConversationThread({
  conversation,
  agentName,
  draft,
  canReply,
  canAssign,
  canResolve,
  viewerId,
  assigneeName,
  detailsOpen,
  focusToken,
  onDraft,
  onSend,
  onTake,
  onResolve,
  onLeave,
  onReopen,
  onOpenTransfer,
  onBack,
  onOpenDetails,
}: {
  conversation: LiveConversation | null;
  agentName: string;
  draft: string;
  canReply: boolean;
  canAssign: boolean;
  canResolve: boolean;
  viewerId: string;
  assigneeName: string | null;
  detailsOpen: boolean;
  focusToken: number;
  onDraft: (value: string) => void;
  onSend: (mode: ComposerMode) => void;
  onTake: () => void;
  onResolve: () => void;
  onLeave: () => void;
  onReopen: () => void;
  onOpenTransfer: () => void;
  onBack: () => void;
  onOpenDetails: () => void;
}) {
  if (!conversation) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-center bg-[#f4f6f8] px-6 text-center">
        <MessageSquareIcon className="h-8 w-8 text-slate-400" aria-hidden="true" />
        <h2 className="mt-3 text-sm font-semibold text-slate-900">Select a chat</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-600">
          Queued chats are customers the assistant has already passed to a person. Take one, reply, or transfer it.
        </p>
      </section>
    );
  }

  return (
    <ThreadView
      conversation={conversation}
      agentName={agentName}
      draft={draft}
      canReply={canReply}
      canAssign={canAssign}
      canResolve={canResolve}
      viewerId={viewerId}
      assigneeName={assigneeName}
      detailsOpen={detailsOpen}
      focusToken={focusToken}
      onDraft={onDraft}
      onSend={onSend}
      onTake={onTake}
      onResolve={onResolve}
      onLeave={onLeave}
      onReopen={onReopen}
      onOpenTransfer={onOpenTransfer}
      onBack={onBack}
      onOpenDetails={onOpenDetails}
    />
  );
}

function ThreadView({
  conversation,
  agentName,
  draft,
  canReply,
  canAssign,
  canResolve,
  viewerId,
  assigneeName,
  detailsOpen,
  focusToken,
  onDraft,
  onSend,
  onTake,
  onResolve,
  onLeave,
  onReopen,
  onOpenTransfer,
  onBack,
  onOpenDetails,
}: {
  conversation: LiveConversation;
  agentName: string;
  draft: string;
  canReply: boolean;
  canAssign: boolean;
  canResolve: boolean;
  viewerId: string;
  assigneeName: string | null;
  detailsOpen: boolean;
  focusToken: number;
  onDraft: (value: string) => void;
  onSend: (mode: ComposerMode) => void;
  onTake: () => void;
  onResolve: () => void;
  onLeave: () => void;
  onReopen: () => void;
  onOpenTransfer: () => void;
  onBack: () => void;
  onOpenDetails: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ownsChat = conversation.ownerId === viewerId && conversation.status === "active";
  const [modeChoice, setModeChoice] = useState<{
    conversationId: string;
    ownsChat: boolean;
    mode: ComposerMode;
  } | null>(null);
  const mode: ComposerMode =
    modeChoice && modeChoice.conversationId === conversation.id && modeChoice.ownsChat === ownsChat
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
  const waited = formatQueueTime(conversation.handedOffAt);
  const noteMode = mode === "note";
  const canCompose =
    canReply &&
    conversation.status !== "resolved" &&
    (noteMode || ownsChat);
  const canSend = canCompose && draft.trim().length > 0 && !draft.trim().startsWith("/");

  useEffect(() => {
    if (focusToken === 0) return;
    headingRef.current?.focus();
  }, [focusToken, conversation.id]);

  return (
    <section
      aria-labelledby="live-chat-thread-title"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#f4f6f8]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden",
              focusRing,
            )}
            aria-label="Back to chats"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              avatarColor(conversation.customerName),
            )}
            aria-hidden="true"
          >
            {initials(conversation.customerName)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="live-chat-thread-title"
                ref={headingRef}
                tabIndex={-1}
                className="truncate text-sm font-semibold text-slate-900 outline-none"
              >
                {conversation.customerName}
              </h2>
              <StatusChip status={conversation.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-600">
              <span>{conversation.channel}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono">{conversation.orderNumber ?? "No order"}</span>
              <span aria-hidden="true"> · </span>
              <span>{assigneeName ?? "Unassigned"}</span>
              {conversation.status === "waiting" ? (
                <span> · {waited === "now" ? "Just queued" : `${waited} in queue`}</span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <IconAction label="Customer details" pressed={detailsOpen} controls="live-chat-customer" onClick={onOpenDetails}>
            <PanelRightIcon className="h-4 w-4" />
          </IconAction>
          {canTransfer ? (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={onOpenTransfer}>
              <ArrowRightLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Transfer
            </Button>
          ) : null}
          {canLeave ? (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={onLeave}>
              <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Leave
            </Button>
          ) : null}
          {canTake ? (
            <Button size="sm" variant="primary" className="cursor-pointer" onClick={onTake}>
              Take chat
            </Button>
          ) : null}
          {canClose ? (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={onResolve}>
              Close
            </Button>
          ) : null}
          {canReopen ? (
            <Button size="sm" variant="outline" className="cursor-pointer" onClick={onReopen}>
              <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Reopen
            </Button>
          ) : null}
        </div>
      </header>

      <MessageList messages={conversation.messages} agentName={agentName} typing={conversation.typing} customerName={conversation.customerName} />

      <footer className="border-t border-slate-200 bg-white p-3">
        {conversation.status === "resolved" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
            <p className="text-sm text-slate-600">This chat is closed. Reopen it if the customer comes back.</p>
            {canReopen ? (
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={onReopen}>
                Reopen
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {conversation.status === "waiting" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-sm text-amber-950">
                  {canAssign
                    ? "This customer is in the queue. Take the chat before you reply."
                    : "Assign access is required before this chat can be taken."}
                </p>
                {canTake ? (
                  <Button size="sm" variant="primary" className="cursor-pointer" onClick={onTake}>
                    Take chat
                  </Button>
                ) : null}
              </div>
            ) : conversation.status === "active" && !ownsChat ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200" role="status">
                {assigneeName ?? "Another person"} has this chat. They can transfer it to you. You can leave a private note.
              </p>
            ) : null}

            {canReply ? (
              <Composer
                conversation={conversation}
                draft={draft}
                mode={mode}
                canSend={canSend}
                canCompose={canCompose}
                onMode={setMode}
                onDraft={onDraft}
                onSend={() => onSend(mode)}
              />
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200" role="status">
                You can read this chat. Reply access is required to message the customer or leave a note.
              </p>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}

function IconAction({
  label,
  pressed,
  controls,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  controls?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={pressed}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
        focusRing,
        pressed && "bg-slate-50 text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function Composer({
  conversation,
  draft,
  mode,
  canSend,
  canCompose,
  onMode,
  onDraft,
  onSend,
}: {
  conversation: LiveConversation;
  draft: string;
  mode: ComposerMode;
  canSend: boolean;
  canCompose: boolean;
  onMode: (mode: ComposerMode) => void;
  onDraft: (value: string) => void;
  onSend: () => void;
}) {
  const [cannedOpen, setCannedOpen] = useState(false);
  const noteMode = mode === "note";
  const slash = draft.trim().startsWith("/") ? draft.trim().slice(1).toLowerCase() : null;
  const canned = useMemo(() => {
    if (slash === null && !cannedOpen) return [];
    const term = slash ?? "";
    return CANNED.filter(
      (item) =>
        !term ||
        item.shortcut.startsWith(term) ||
        item.title.toLowerCase().includes(term),
    );
  }, [cannedOpen, slash]);
  const showCanned = cannedOpen || slash !== null;

  const insert = (body: string) => {
    onDraft(fillCanned(body, conversation.customerName));
    setCannedOpen(false);
  };

  return (
    <form
      className={cn(
        "rounded-xl border bg-white shadow-sm",
        noteMode
          ? "border-amber-300 focus-within:ring-2 focus-within:ring-amber-400/30"
          : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
    >
      <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5">
        <ModeButton active={!noteMode} onClick={() => onMode("reply")} label="Reply" />
        <ModeButton active={noteMode} onClick={() => onMode("note")} label="Private note" />
        <button
          type="button"
          aria-expanded={showCanned}
          aria-controls="live-chat-canned"
          onClick={() => setCannedOpen((open) => !open)}
          className={cn(
            "ml-auto inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-600 hover:bg-slate-100",
            focusRing,
            showCanned && "bg-slate-100 text-slate-900",
          )}
        >
          <BookMarkedIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Canned
        </button>
      </div>

      {showCanned ? (
        <div id="live-chat-canned" className="border-b border-slate-100 bg-slate-50 p-1.5" role="listbox" aria-label="Canned responses">
          {canned.length === 0 ? (
            <p className="px-2 py-2 text-xs text-slate-600">No saved replies match. Try /hi, /track, /refund, /hold, or /close.</p>
          ) : (
            canned.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => insert(item.body)}
                className={cn("flex w-full cursor-pointer flex-col rounded-md px-2 py-1.5 text-left hover:bg-white", focusRing)}
              >
                <span className="text-xs font-semibold text-slate-900">
                  /{item.shortcut}
                  <span className="ml-2 font-medium text-slate-500">{item.title}</span>
                </span>
                <span className="truncate text-xs text-slate-600">{fillCanned(item.body, conversation.customerName)}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <label htmlFor="live-chat-reply" className="sr-only">
        {noteMode ? `Private note on ${conversation.customerName}` : `Reply to ${conversation.customerName}`}
      </label>
      <textarea
        id="live-chat-reply"
        rows={3}
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={
          noteMode
            ? "Private note. Customers never see this. Type / for a saved reply."
            : canCompose
              ? `Reply to ${conversation.customerName}. Type / for a saved reply.`
              : "Take this chat to reply, or switch to a private note."
        }
        disabled={!canCompose}
        aria-describedby="live-chat-reply-hint"
        className={cn(
          "w-full resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-slate-500 disabled:bg-slate-50",
          noteMode ? "text-amber-950" : "text-slate-900",
          focusRing,
        )}
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-2">
        <p id="live-chat-reply-hint" className="flex items-center gap-1.5 text-xs text-slate-500">
          {noteMode ? <StickyNoteIcon className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> : null}
          {noteMode ? "Only agents can see private notes." : "Enter to send. Shift+Enter for a new line."}
        </p>
        <Button type="submit" size="sm" variant="primary" className="cursor-pointer" disabled={!canSend}>
          <SendIcon className="h-4 w-4" aria-hidden="true" />
          {noteMode ? "Save note" : "Send"}
        </Button>
      </div>
    </form>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-md px-2 py-1 text-xs font-medium",
        focusRing,
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {label}
    </button>
  );
}

function MessageList({
  messages,
  agentName,
  typing,
  customerName,
}: {
  messages: ChatMessage[];
  agentName: string;
  typing: boolean;
  customerName: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, typing]);

  return (
    <div aria-label="Conversation" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          agentName={agentName}
          grouped={
            index > 0 &&
            messages[index - 1].author === message.author &&
            messages[index - 1].authorName === message.authorName &&
            message.author !== "system" &&
            message.author !== "note"
          }
        />
      ))}
      {typing ? (
        <p className="text-xs font-medium text-slate-500" role="status">
          {customerName} is typing…
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}

function MessageBubble({
  message,
  agentName,
  grouped,
}: {
  message: ChatMessage;
  agentName: string;
  grouped: boolean;
}) {
  const name = message.authorName === "You" ? agentName : message.authorName;
  const time = formatMessageTime(message.at);

  if (message.author === "system") {
    return (
      <div className="flex justify-center py-1">
        <p className="max-w-lg rounded-full bg-white px-3 py-1 text-center text-xs leading-5 text-slate-600 ring-1 ring-slate-200">
          {message.body}
        </p>
      </div>
    );
  }

  if (message.author === "note") {
    return (
      <article className="mx-auto w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-[11px] font-semibold tracking-wide text-amber-800 uppercase">
          Private note · {name} · <time dateTime={message.at}>{time}</time>
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-950">{message.body}</p>
      </article>
    );
  }

  const isAgent = message.author === "agent";
  const isAssistant = message.author === "assistant";

  return (
    <article className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[min(40rem,85%)]", isAgent && "items-end")}>
        {grouped ? null : (
          <p
            className={cn(
              "mb-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500",
              isAgent && "justify-end",
            )}
          >
            {isAssistant ? <BotIcon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            <span>{isAssistant ? "AI assistant" : name}</span>
            <time dateTime={message.at}>{time}</time>
          </p>
        )}
        <p
          className={cn(
            "px-3.5 py-2.5 text-sm leading-6",
            isAgent
              ? "rounded-2xl rounded-br-md bg-indigo-600 text-white"
              : isAssistant
                ? "rounded-2xl rounded-bl-md bg-slate-200/80 text-slate-800"
                : "rounded-2xl rounded-bl-md bg-white text-slate-900 shadow-sm ring-1 ring-slate-200",
          )}
        >
          {grouped ? (
            <span className="sr-only">
              {name}, {time}.{" "}
            </span>
          ) : null}
          {message.body}
        </p>
      </div>
    </article>
  );
}
