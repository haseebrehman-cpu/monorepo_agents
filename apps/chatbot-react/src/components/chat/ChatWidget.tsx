import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatOption } from "@rdx/chat-contract";
import ChatHeader from "./ChatHeader";
import ChatLauncher from "./ChatLauncher";
import ChatComposer from "./ChatComposer";
import MessageList from "./MessageList";
import { createMessageId, createWelcomeMessage } from "./messages";
import { PANEL_ID, STORE_NAME } from "./constants";
import { sendChatMessage } from "@/lib/chat-api";
import { useDialogFocus } from "@/lib/use-dialog-focus";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
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

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const handleNewChat = useCallback(() => {
    setInput("");
    setIsTyping(false);
    setMessages([createWelcomeMessage()]);
  }, []);

  const sendUserText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await sendChatMessage(trimmed);
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: result.reply,
        attachments: result.attachments,
        showMenu: /^m$/i.test(trimmed),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: message,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (isTyping) return;
    void sendUserText(input);
  }, [input, isTyping, sendUserText]);

  const handleOptionSelect = useCallback(
    (option: ChatOption) => {
      if (isTyping || !option.enabled) return;
      void sendUserText(option.label);
    },
    [isTyping, sendUserText],
  );

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
          className="fixed right-5 bottom-32 z-50 flex h-[600px] max-h-[calc(100vh-8.5rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        >
          <ChatHeader
            isTyping={isTyping}
            onNewChat={handleNewChat}
            onClose={close}
          />

          <MessageList
            messages={messages}
            isTyping={isTyping}
            onOptionSelect={handleOptionSelect}
            scrollRef={scrollRef}
          />

          <ChatComposer
            value={input}
            isTyping={isTyping}
            inputRef={inputRef}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </>
  );
}
