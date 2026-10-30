"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportProduct, SupportStoreCode } from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { usePageEvent } from "@/lib/api/use-page-event";
import { useBag } from "@/lib/bag/bag-store";
import { STORE_NAME } from "@/lib/chat/constants";
import { isHome } from "@/lib/chat/transcript";
import { useSupportChat } from "@/lib/chat/use-support-chat";
import BagPanel from "./BagPanel";
import { ChatActionsProvider, type ChatActions } from "./chat-context";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";

interface ChatPanelProps {
  id: string;
  store: SupportStoreCode;
  expanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

function productEventData(product: Pick<SupportProduct, "product_id" | "title">, quantity?: number) {
  return { product_id: product.product_id, title: product.title, ...(quantity ? { quantity } : {}) };
}

export default function ChatPanel({ id, store, expanded, onToggleExpand, onClose }: ChatPanelProps) {
  const chat = useSupportChat(store);
  const bag = useBag(store);
  const { track, conversationId } = usePageEvent(store, chat.pendingInput !== null);
  const [input, setInput] = useState("");
  const [bagOpen, setBagOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isTyping, send, reset } = chat;
  const home = isHome(messages);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: home ? 0 : node.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, home, bagOpen]);

  useEffect(() => {
    if (!bagOpen) inputRef.current?.focus();
  }, [bagOpen]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const { add: addLine, setQuantity, remove, lines } = bag;

  const actions = useMemo<ChatActions>(
    () => ({
      store,
      isTyping,
      send,
      addToBag: (product) => {
        addLine(product);
        setNotice(`${product.title} added to your bag.`);
        track({ type: "cart_add", data: productEventData(product, 1) });
      },
      viewProduct: (product) => track({ type: "product_viewed", data: productEventData(product) }),
      quantityInBag: (productId) => lines.find((line) => line.productId === productId)?.quantity ?? 0,
    }),
    [addLine, isTyping, lines, send, store, track],
  );

  const handleQuantity = useCallback(
    (productId: string, quantity: number) => {
      const line = lines.find((l) => l.productId === productId);
      setQuantity(productId, quantity);
      if (line) {
        track({
          type: "cart_update",
          data: { product_id: productId, title: line.title, quantity },
        });
      }
    },
    [lines, setQuantity, track],
  );

  const handleRemove = useCallback(
    (productId: string) => {
      const line = lines.find((l) => l.productId === productId);
      remove(productId);
      if (line) track({ type: "cart_remove", data: { product_id: productId, title: line.title } });
    },
    [lines, remove, track],
  );

  const handleSubmit = useCallback(() => {
    if (isTyping || !input.trim()) return;
    send(input);
    setInput("");
  }, [input, isTyping, send]);

  const handleNewChat = useCallback(() => {
    reset();
    setInput("");
    setBagOpen(false);
  }, [reset]);

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
          : "right-3 bottom-24 left-3 h-[min(680px,calc(100dvh-7.5rem))] rounded-3xl sm:right-5 sm:left-auto sm:w-[420px]",
      )}
    >
      <ChatHeader
        store={store}
        isTyping={isTyping}
        expanded={expanded}
        cartOpen={bagOpen}
        cartCount={bag.itemCount}
        onToggleExpand={onToggleExpand}
        onToggleCart={() => setBagOpen((open) => !open)}
        onNewChat={handleNewChat}
        onClose={onClose}
      />

      <ChatActionsProvider value={actions}>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {notice && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
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
              store={store}
              bag={bag}
              conversationId={conversationId}
              onQuantityChange={handleQuantity}
              onRemove={handleRemove}
              onClose={() => setBagOpen(false)}
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
    </div>
  );
}
