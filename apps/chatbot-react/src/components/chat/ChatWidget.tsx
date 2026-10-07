import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatOption } from "@rdx/chat-contract";
import { useTimedCartNotice } from "@/lib/cart-outcome";
import { orderTrackingForm } from "@/lib/order-api";
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
  const elementRef = useRef<HTMLDivElement>(null);
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
  const regionRef = useRef(region);
  const close = useCallback(() => setIsOpen(false), []);

  const clearConversation = useCallback(() => {
    generationRef.current += 1;
    conversationIdRef.current = null;
    setInput("");
    setCartOpen(false);
    setCartNotice(null);
    setFailedListingIds(new Set());
    setMessages([createWelcomeMessage()]);
  }, [setCartNotice]);

  if (cartSessionRegion !== region) {
    setCartSessionRegion(region);
    setIsOpen(true);
    setInput("");
    setCartOpen(false);
    setCartNotice(null);
    setFailedListingIds(new Set());
    setMessages([createWelcomeMessage()]);
  }

  useEffect(() => {
    if (regionRef.current === region) return;
    regionRef.current = region;
    generationRef.current += 1;
    conversationIdRef.current = null;
    sendChat.reset();
  }, [region, sendChat]);

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
    clearConversation();
    sendChat.reset();
  }, [clearConversation, sendChat]);

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
            const nextConversationId = result.conversation_id?.trim();
            if (nextConversationId) {
              conversationIdRef.current = nextConversationId;
            }
            const orderVerification = orderTrackingForm(result, trimmed);

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
                order_verification: orderVerification,
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
          ref={elementRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${STORE_NAME} Assistant`}
          tabIndex={-1}
          className="rdx-chat-panel fixed right-5 bottom-32 z-50 flex h-[600px] max-h-[calc(100vh-8.5rem)] w-[420px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        >
          <ChatHeader
            isTyping={isTyping}
            onNewChat={handleNewChat}
            onClose={close}
            onToggleCart={() => setCartOpen((open) => !open)}
            cartOpen={cartOpen}
            cartCount={cart.data?.lines?.length ?? 0}
            region={region}
            elementRef={elementRef as React.RefObject<HTMLDivElement>}
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
                onNotSatisfied={sendUserText}
                onTalkToPerson={sendUserText}
                scrollRef={scrollRef}
              />

              {cartNotice && (
                <p
                  className="rdx-chat-thread mx-4 mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-800"
                  role="status"
                >
                  {cartNotice.text}
                </p>
              )}

              <div className="rdx-chat-composer border-neutral-200 bg-neutral-50">
                <ChatComposer
                  value={input}
                  isTyping={isTyping}
                  inputRef={inputRef}
                  onChange={setInput}
                  onSubmit={handleSubmit}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
