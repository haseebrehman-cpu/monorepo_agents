import { useCallback, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatLauncher from "./ChatLauncher";
import ChatComposer from "./ChatComposer";
import MessageList from "./MessageList";
import { PANEL_ID, STORE_NAME } from "./constants";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import type { ChatMessage } from "@rdx/chat-contract";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setIsOpen(false), []);

  useDialogFocus({
    isOpen,
    onClose: close,
    panelId: PANEL_ID,
    launcherRef,
  });

  return (
    <>
      <ChatLauncher
        isOpen={isOpen}
        panelId={PANEL_ID}
        onToggle={() => setIsOpen((open) => !open)}
        buttonRef={launcherRef}
      />

      {isOpen && (
        <div
          id={PANEL_ID}
          role="dialog"
          aria-modal="true"
          aria-label={`${STORE_NAME} Assistant`}
          tabIndex={-1}
          className="fixed right-5 bottom-24 z-50 flex h-[600px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <ChatHeader
            isTyping={isTyping}
            onNewChat={() => setMessages([])}
            onClose={close}
            onFullScreen={() => {}}
          />

          <MessageList
            messages={messages}
            isTyping={isTyping}
            onOptionSelect={() => {}}
            scrollRef={scrollRef}
          />

          <ChatComposer
            value={input}
            isTyping={isTyping}
            inputRef={inputRef}
            onChange={setInput}
            onSubmit={() => {}}
          />
        </div>
      )}
    </>
  );
}
