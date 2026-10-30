import Image from "next/image";
import type { ReactNode, RefObject } from "react";
import { cn } from "@rdx/ui/lib/utils";
import { CHATBOT_ICON_SRC } from "@/lib/chat/constants";
import { formatTime } from "@/lib/chat/format";
import {
  latestAssistantId,
  type AssistantMessage,
  type ChatMessage,
  type UserMessage,
} from "@/lib/chat/transcript";
import { ReplyBody, ReplyProducts } from "./AssistantReply";
import { useChatActions } from "./chat-context";
import WelcomeView from "./WelcomeView";

interface MessageListProps {
  messages: ChatMessage[];
  scrollRef: RefObject<HTMLDivElement | null>;
}

function BotAvatar() {
  return (
    <Image
      src={CHATBOT_ICON_SRC}
      alt=""
      width={56}
      height={56}
      className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#e7e7e9] object-contain ring-1 ring-neutral-200"
    />
  );
}

function Timestamp({ at, children }: { at?: number; children?: ReactNode }) {
  if (!at && !children) return null;
  return (
    <div className="mt-1 flex items-center gap-2 px-1 text-[10px] text-neutral-400">
      {at && <span>{formatTime(at)}</span>}
      {children}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="animate-rdx-rise flex items-end gap-2" role="status" aria-label="Assistant is typing">
      <BotAvatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-rdx-red"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: UserMessage }) {
  return (
    <div className="animate-rdx-rise flex flex-col items-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-rdx-red px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-white shadow-sm">
        {message.text}
      </div>
      <Timestamp at={message.createdAt} />
    </div>
  );
}

function AssistantBubble({
  message,
  isLatest,
  showMenuHint,
}: {
  message: Exclude<AssistantMessage, { kind: "welcome" }>;
  isLatest: boolean;
  showMenuHint: boolean;
}) {
  const isError = message.kind === "error";
  return (
    <div className="animate-rdx-rise flex items-start gap-2">
      <BotAvatar />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border px-3.5 py-3 shadow-sm",
            isError ? "border-red-200 bg-red-50" : "border-neutral-200 bg-white",
          )}
        >
          {isError ? (
            <>
              <p className="text-[13px] leading-relaxed text-red-800">{message.text}</p>
              {message.requestId && (
                <p className="mt-1 font-mono text-[10px] text-red-400">Ref {message.requestId}</p>
              )}
            </>
          ) : (
            <ReplyBody reply={message.reply} isLatest={isLatest} />
          )}
        </div>
        {!isError && <ReplyProducts reply={message.reply} />}
        <Timestamp at={message.createdAt}>
          {showMenuHint && (
            <span>
              · Type <span className="font-semibold text-neutral-600">M</span> for the main menu
            </span>
          )}
        </Timestamp>
      </div>
    </div>
  );
}

export default function MessageList({ messages, scrollRef }: MessageListProps) {
  const { store, isTyping, send } = useChatActions();
  const latestId = latestAssistantId(messages);
  const hasUserMessages = messages.some((m) => m.role === "user");
  const latestWelcomeId = messages.findLast((m) => m.role === "assistant" && m.kind === "welcome")?.id;

  return (
    <div
      ref={scrollRef}
      className="rdx-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-100/70 px-4 py-4"
      aria-live="polite"
      aria-busy={isTyping}
    >
      <div className="mx-auto w-full space-y-4 group-data-[expanded=true]/panel:max-w-3xl">
        {messages.map((message) => {
          if (message.role === "user") return <UserBubble key={message.id} message={message} />;
          if (message.kind === "welcome") {
            if (message.id !== latestWelcomeId) return null;
            return (
              <WelcomeView
                key={message.id}
                store={store}
                disabled={isTyping}
                compact={hasUserMessages}
                onSelect={(option) => send(option.message, { displayText: option.label })}
                onQuestion={(question) => send(question.message, { displayText: question.label })}
              />
            );
          }
          const isLatest = message.id === latestId;
          return (
            <AssistantBubble
              key={message.id}
              message={message}
              isLatest={isLatest}
              showMenuHint={isLatest && hasUserMessages}
            />
          );
        })}

        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
}
