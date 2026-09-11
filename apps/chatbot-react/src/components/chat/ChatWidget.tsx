import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatOption } from "@rdx/chat-contract";
import { useTimedCartNotice } from "@/lib/cart-outcome";
import { useCart } from "@/lib/use-cart";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { useSendChat } from "@/lib/use-send-chat";
import CartPanel from "./CartPanel";
import ChatHeader from "./ChatHeader";
import ChatLauncher from "./ChatLauncher";
import ChatComposer from "./ChatComposer";
import MessageList from "./MessageList";
import { createMessageId, createWelcomeMessage } from "./messages";
import { PANEL_ID, STORE_NAME } from "./constants";

export default function ChatWidget({ region }: { region: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const sendChat = useSendChat();
  const cart = useCart(region, isOpen);
  const isTyping = sendChat.isPending;
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useTimedCartNotice();
  const [failedListingIds, setFailedListingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [cartSessionRegion, setCartSessionRegion] = useState(region);
  const conversationIdRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setIsOpen(false), []);

  if (cartSessionRegion !== region) {
    setCartSessionRegion(region);
    setCartOpen(false);
    setCartNotice(null);
    setFailedListingIds(new Set());
  }

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
    generationRef.current += 1;
    conversationIdRef.current = null;
    sendChat.reset();
    setInput("");
    setCartOpen(false);
    setCartNotice(null);
    setMessages([createWelcomeMessage()]);
  }, [sendChat, setCartNotice]);

  const handleListingFailed = useCallback((listingId: string) => {
    setFailedListingIds((prev) => new Set(prev).add(listingId));
  }, []);

  const sendUserText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendChat.isPending) return;

      const generation = generationRef.current;
      const clientMessageId = createMessageId();

      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: "user", content: trimmed },
      ]);
      setInput("");

      sendChat.mutate(
        {
          message: trimmed,
          conversation_id: conversationIdRef.current,
          client_message_id: clientMessageId,
          region,
        },
        {
          onSuccess: (result) => {
            if (generation !== generationRef.current) return;
            conversationIdRef.current = result.conversation_id;
            setMessages((prev) => [
              ...prev,
              {
                id: createMessageId(),
                role: "assistant",
                content: result.answer,
                products: result.products,
                citations: result.citations,
                escalated: result.escalated,
                degraded: result.degraded,
                showMenu: /^m$/i.test(trimmed),
              },
            ]);
          },
          onError: (error) => {
            if (generation !== generationRef.current) return;
            setMessages((prev) => [
              ...prev,
              {
                id: createMessageId(),
                role: "assistant",
                content:
                  error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again.",
              },
            ]);
          },
        },
      );
    },
    [region, sendChat],
  );

  const handleSubmit = useCallback(() => {
    if (isTyping) return;
    sendUserText(input);
  }, [input, isTyping, sendUserText]);

  const handleOptionSelect = useCallback(
    (option: ChatOption) => {
      if (isTyping || !option.enabled) return;
      sendUserText(option.label);
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
            onToggleCart={() => setCartOpen((open) => !open)}
            cartOpen={cartOpen}
            cartCount={cart.data?.lines?.length ?? 0}
            region={region}
          />

          {cartOpen ? (
            <CartPanel
              region={region}
              cart={cart.data}
              notice={cartNotice}
              onNotice={setCartNotice}
              onClose={() => setCartOpen(false)}
            />
          ) : (
            <>
              <MessageList
                messages={messages}
                isTyping={isTyping}
                region={region}
                failedListingIds={failedListingIds}
                onListingFailed={handleListingFailed}
                onCartNotice={setCartNotice}
                onOptionSelect={handleOptionSelect}
                scrollRef={scrollRef}
              />

              {cartNotice && (
                <p
                  className="mx-4 mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800"
                  role="status"
                >
                  {cartNotice.text}
                </p>
              )}

              <ChatComposer
                value={input}
                isTyping={isTyping}
                inputRef={inputRef}
                onChange={setInput}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
