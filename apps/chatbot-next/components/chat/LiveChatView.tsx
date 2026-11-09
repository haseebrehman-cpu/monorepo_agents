"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveChatMessage } from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { formatTime } from "@/lib/chat/format";
import type { PendingMessage } from "@/lib/live-chat/state";
import type { LiveChat } from "@/lib/live-chat/use-live-chat";
import ChatComposer from "./ChatComposer";
import { HeadsetIcon } from "./icons";
import Spinner from "./Spinner";

interface LiveChatViewProps {
  chat: LiveChat;
  reference: string;
  /** False until a customer token is ready. Typing before that would be dropped. */
  canSend: boolean;
  joinError: boolean;
  onRetryJoin: () => void;
  onStartNewChat: () => void;
}

function Time({ at }: { at: string | number }) {
  return <span className="mt-1 px-1 text-[10px] text-neutral-400">{formatTime(new Date(at).getTime())}</span>;
}

function AgentAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="mt-5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rdx-black text-[11px] font-semibold text-white uppercase"
    >
      {name.charAt(0) || "?"}
    </span>
  );
}

function ServerMessage({ message }: { message: LiveChatMessage }) {
  if (message.author === "system") {
    return (
      <p className="animate-rdx-rise mx-auto w-fit rounded-full bg-neutral-200/70 px-3 py-1 text-center text-[11px] font-medium text-neutral-600">
        {message.body}
      </p>
    );
  }
  if (message.author === "customer") {
    return (
      <div className="animate-rdx-rise flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-rdx-red px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-white shadow-sm">
          {message.body}
        </div>
        <Time at={message.at} />
      </div>
    );
  }
  return (
    <div className="animate-rdx-rise flex items-start gap-2">
      <AgentAvatar name={message.authorName} />
      <div className="flex min-w-0 max-w-[85%] flex-col items-start">
        <span className="mb-1 px-1 text-[11px] font-semibold text-neutral-600">{message.authorName}</span>
        <div className="rounded-2xl rounded-tl-md border border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-neutral-900 shadow-sm">
          {message.body}
        </div>
        <Time at={message.at} />
      </div>
    </div>
  );
}

function PendingBubble({ message, onRetry }: { message: PendingMessage; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-end">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-white shadow-sm",
          message.failed ? "bg-rdx-red/50" : "bg-rdx-red/80",
        )}
      >
        {message.body}
      </div>
      {message.failed ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 cursor-pointer px-1 text-[10px] font-semibold text-red-600 hover:underline"
        >
          Not sent · Tap to retry
        </button>
      ) : (
        <span className="mt-1 px-1 text-[10px] text-neutral-400">Sending…</span>
      )}
    </div>
  );
}

function QueueNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rdx-red/10 text-rdx-red">
        <HeadsetIcon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[13px] font-semibold text-neutral-900">You&apos;re in the queue</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
          A member of our support team will join shortly. You can reply once they send the first message.
        </p>
      </div>
    </div>
  );
}

function WaitingForGreeting({ agentName }: { agentName: string | null }) {
  const name = agentName ?? "A team member";
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <HeadsetIcon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[13px] font-semibold text-neutral-900">{name} has joined</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
          You can reply once they send the first message.
        </p>
      </div>
    </div>
  );
}

function EndedNotice({ expired, onStartNewChat }: { expired: boolean; onStartNewChat: () => void }) {
  return (
    <div className="border-t border-neutral-200 bg-white px-4 py-4 text-center">
      <p className="text-[13px] font-semibold text-neutral-900">
        {expired ? "This chat session has expired" : "This chat has ended"}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">Thanks for chatting with us. Need anything else?</p>
      <button
        type="button"
        onClick={onStartNewChat}
        className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-rdx-red px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover"
      >
        Start a new chat
      </button>
    </div>
  );
}

/** The customer's side of a live chat with a person. The assistant does not take part. */
export default function LiveChatView({
  chat,
  reference,
  canSend,
  joinError,
  onRetryJoin,
  onStartNewChat,
}: LiveChatViewProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, pending, status, connection, ended, expired, mayReply, send, retry } = chat;
  const canReply = canSend && mayReply && !joinError;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, pending, status]);

  useEffect(() => {
    if (canReply) inputRef.current?.focus();
  }, [canReply]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || ended || !canReply) return;
    send(input);
    setInput("");
  }, [canReply, ended, input, send]);

  return (
    <>
      <div
        ref={scrollRef}
        className="rdx-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-neutral-100/70 px-4 py-4"
        aria-live="polite"
      >
        <div className="mx-auto w-full space-y-4 group-data-[expanded=true]/panel:max-w-3xl">
          <p className="text-center font-mono text-[10px] text-neutral-400">Ref {reference}</p>

          {status === null && !expired && !joinError && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-neutral-500">
              <Spinner className="border-neutral-300 border-t-rdx-red" />
              Connecting you to our team…
            </div>
          )}
          {status === "waiting" && <QueueNotice />}
          {status === "active" && !mayReply && !expired && <WaitingForGreeting agentName={chat.agentName} />}

          {messages.map((message) => (
            <ServerMessage key={message.id} message={message} />
          ))}
          {pending.map((message) => (
            <PendingBubble key={message.clientId} message={message} onRetry={() => retry(message.clientId)} />
          ))}
        </div>
      </div>

      {connection === "reconnecting" && !ended && (
        <p role="status" className="bg-amber-50 px-4 py-1.5 text-center text-[11px] font-medium text-amber-800">
          Reconnecting… messages will appear as soon as you&apos;re back online.
        </p>
      )}

      {ended ? (
        <EndedNotice expired={expired} onStartNewChat={onStartNewChat} />
      ) : (
        <>
          {joinError && (
            <div className="border-t border-neutral-200 bg-white px-4 py-3 text-center">
              <p className="text-[13px] font-semibold text-neutral-900">Couldn&apos;t open the live chat</p>
              <p className="mt-0.5 text-xs text-neutral-500">The handoff is saved. Try connecting again.</p>
              <button
                type="button"
                onClick={onRetryJoin}
                className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl bg-rdx-red px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover"
              >
                Try again
              </button>
            </div>
          )}
          {chat.agentTyping && canReply && (
            <p role="status" className="bg-white px-4 pt-2 text-center text-[11px] font-medium text-neutral-500">
              {chat.agentName ?? "Support"} is typing…
            </p>
          )}
          <ChatComposer
            value={input}
            isTyping={false}
            disabled={!canReply}
            inputRef={inputRef}
            onChange={(value) => {
              if (!canReply) return;
              setInput(value);
              chat.notifyTyping(value.trim().length > 0);
            }}
            onSubmit={handleSubmit}
            placeholder={
              canReply
                ? "Message our support team…"
                : status === "active"
                  ? "Waiting for the first message…"
                  : "Waiting for a team member…"
            }
          />
        </>
      )}
    </>
  );
}
