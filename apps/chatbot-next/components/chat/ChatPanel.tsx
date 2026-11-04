"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportProduct, SupportStoreCode } from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { friendlyError } from "@/lib/api/errors";
import { useSupportCart } from "@/lib/api/use-cart";
import { usePageEvent } from "@/lib/api/use-page-event";
import { STORE_NAME } from "@/lib/chat/constants";
import { isHome } from "@/lib/chat/transcript";
import { useSupportChat } from "@/lib/chat/use-support-chat";
import { liveChatHandoffFromReply, useLiveChatSession } from "@/lib/live-chat/session";
import { useLiveChat, type LiveChat } from "@/lib/live-chat/use-live-chat";
import BagPanel, { CheckoutFollowUp } from "./BagPanel";
import { ChatActionsProvider, type ChatActions } from "./chat-context";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import LiveChatView from "./LiveChatView";
import MessageList from "./MessageList";

interface ChatPanelProps {
  id: string;
  store: SupportStoreCode;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

const CHECKOUT_BAG_PROMPT_MS = 2500;

function productEventData(product: Pick<SupportProduct, "product_id" | "title">) {
  return { product_id: product.product_id, title: product.title };
}

function liveStatus(chat: LiveChat) {
  if (chat.ended) return { dot: "bg-neutral-400", text: "Chat ended" };
  if (chat.connection === "reconnecting") return { dot: "bg-amber-400 animate-pulse", text: "Reconnecting…" };
  if (chat.status === "active" && chat.agentName) {
    return { dot: "bg-emerald-400", text: `Chatting with ${chat.agentName}` };
  }
  if (chat.status === "active") return { dot: "bg-emerald-400", text: "Chatting with our team" };
  return { dot: "bg-amber-400 animate-pulse", text: "Waiting for a team member" };
}

export default function ChatPanel({ id, store, expanded, onToggleExpand, onClose }: ChatPanelProps) {
  const live = useLiveChatSession(store);
  const chat = useSupportChat(store, { onHandoff: live.open });
  const liveChat = useLiveChat(live.session);
  const bag = useSupportCart(store);
  const { track } = usePageEvent(store, chat.pendingInput !== null);
  const [input, setInput] = useState("");
  const [bagOpen, setBagOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutPrompt, setCheckoutPrompt] = useState(false);
  const checkoutTimer = useRef<number | null>(null);
  const itemCountRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isTyping, send, reset } = chat;
  const { session: liveSession, open: openLiveChat } = live;
  const home = isHome(messages);

  useEffect(() => {
    if (liveSession) return;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role !== "assistant" || message.kind !== "reply") continue;
      const handoff = liveChatHandoffFromReply(message.reply);
      if (!handoff) continue;
      openLiveChat(handoff);
      return;
    }
  }, [liveSession, messages, openLiveChat]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: home ? 0 : node.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, home, bagOpen]);

  useEffect(() => {
    if (!bagOpen) inputRef.current?.focus();
  }, [bagOpen]);

  const { refresh } = bag;
  useEffect(() => {
    if (bagOpen) void refresh();
  }, [bagOpen, refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const { cart, addItem, updateItem, clearCart, isClearing } = bag;
  if (cart.item_count === 0 && !isClearing && checkoutPrompt) setCheckoutPrompt(false);

  useEffect(() => {
    itemCountRef.current = cart.item_count;
  }, [cart.item_count]);

  useEffect(() => {
    return () => {
      if (checkoutTimer.current !== null) window.clearTimeout(checkoutTimer.current);
    };
  }, []);

  const actions = useMemo<ChatActions>(
    () => ({
      store,
      isTyping,
      send,
      addToBag: (product, variantId) => {
        void addItem({ variantId })
          .then(() => setNotice(`${product.title} added to your bag.`))
          .catch((error: unknown) => setNotice(friendlyError(error, "cart")));
      },
      viewProduct: (product) => track({ type: "product_viewed", data: productEventData(product) }),
      quantityInBag: (variantId) =>
        cart.items.find((line) => line.variant_id === variantId)?.quantity ?? 0,
    }),
    [addItem, cart.items, isTyping, send, store, track],
  );

  const handleQuantity = useCallback(
    (variantId: string, quantity: number) => {
      void updateItem({ variantId, quantity }).catch((error: unknown) =>
        setNotice(friendlyError(error, "cart")),
      );
    },
    [updateItem],
  );

  const handleRemove = useCallback(
    (variantId: string) => {
      void updateItem({ variantId, quantity: 0 }).catch((error: unknown) =>
        setNotice(friendlyError(error, "cart")),
      );
    },
    [updateItem],
  );

  const handleEmpty = useCallback(() => {
    return clearCart()
      .then((next) => {
        setNotice(
          next.items.length === 0
            ? "Your bag is empty."
            : "Some items are still in your bag. Please try again.",
        );
      })
      .catch((error: unknown) => setNotice(friendlyError(error, "cart")));
  }, [clearCart]);

  const dismissCheckoutPrompt = useCallback(() => setCheckoutPrompt(false), []);

  const handleCheckout = useCallback((checkoutUrl: string) => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    if (checkoutTimer.current !== null) window.clearTimeout(checkoutTimer.current);
    setCheckoutPrompt(false);
    checkoutTimer.current = window.setTimeout(() => {
      checkoutTimer.current = null;
      if (itemCountRef.current > 0) setCheckoutPrompt(true);
    }, CHECKOUT_BAG_PROMPT_MS);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isTyping || !input.trim()) return;
    send(input);
    setInput("");
  }, [input, isTyping, send]);

  const { end: endLiveChat } = live;
  const handleNewChat = useCallback(() => {
    endLiveChat();
    reset();
    setInput("");
    setBagOpen(false);
  }, [endLiveChat, reset]);

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-label={`${STORE_NAME} assistant`}
      data-expanded={expanded}
      className={cn(
        "group/panel animate-rdx-pop fixed z-50 flex flex-col overflow-hidden bg-white text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/10 transition-[inset,width,height,border-radius] duration-300",
        expanded
          ? "inset-0 rounded-none sm:inset-6 sm:rounded-3xl"
          : "right-3 bottom-24 left-3 h-[min(680px,calc(100dvh-7.5rem))] rounded-3xl sm:right-5 sm:left-auto sm:w-[min(560px,calc(100vw-2.5rem))]",
      )}
    >
      <ChatHeader
        store={store}
        isTyping={isTyping}
        expanded={expanded}
        cartOpen={bagOpen}
        cartCount={bag.cart.item_count}
        onToggleExpand={onToggleExpand}
        onToggleCart={() => setBagOpen((open) => !open)}
        onNewChat={handleNewChat}
        onClose={onClose}
        statusOverride={live.session ? liveStatus(liveChat) : undefined}
      />

      <ChatActionsProvider value={actions}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {notice && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[60] flex justify-center px-4">
              <p
                role="status"
                className="animate-rdx-rise rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-lg"
              >
                {notice}
              </p>
            </div>
          )}

          {bagOpen ? (
            <BagPanel
              cart={bag.cart}
              isLoading={bag.isLoading}
              isClearing={isClearing}
              pendingVariantId={bag.pendingVariantId}
              onQuantityChange={handleQuantity}
              onRemove={handleRemove}
              onEmpty={handleEmpty}
              onCheckout={handleCheckout}
              onClose={() => setBagOpen(false)}
            />
          ) : live.session ? (
            <LiveChatView
              chat={liveChat}
              reference={live.session.reference}
              canSend={Boolean(live.session.token)}
              joinError={live.joinError}
              onRetryJoin={live.retry}
              onStartNewChat={handleNewChat}
            />
          ) : (
            <>
              <MessageList messages={messages} scrollRef={scrollRef} />
              <ChatComposer
                value={input}
                isTyping={isTyping}
                inputRef={inputRef}
                onChange={setInput}
                onSubmit={handleSubmit}
                placeholder={chat.pendingInput ? "Type your answer…" : undefined}
              />
            </>
          )}
        </div>
      </ChatActionsProvider>

      {checkoutPrompt && cart.item_count > 0 && (
        <CheckoutFollowUp
          itemCount={cart.item_count}
          isClearing={isClearing}
          onKeep={dismissCheckoutPrompt}
          onEmpty={handleEmpty}
        />
      )}
    </div>
  );
}
