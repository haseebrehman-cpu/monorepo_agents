import type { RefObject } from "react";
import type { ChatMessage, ChatOption } from "@rdx/chat-contract";
import type { CartNotice } from "@/lib/cart-outcome";
import {
  collectDisplayProducts,
  // nonProductCitations,
  stripProductLinksFromAnswer,
} from "@/lib/product-cards";
// import CitationList from "./CitationList";
import MessageContent from "./MessageContent";
import OptionButtons from "./OptionButtons";
import ProductCard from "./ProductCard";
import SizeChartAttachment from "./SizeChartAttachment";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  region: string;
  failedListingIds: Set<string>;
  onListingFailed: (listingId: string) => void;
  onCartNotice: (notice: CartNotice) => void;
  onAddedToCart: () => void;
  onOptionSelect: (option: ChatOption) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

function TypingIndicator() {
  return (
    <div
      className="mr-auto flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-4 py-3 shadow-sm"
      aria-label="Assistant is typing"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rdx-red [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rdx-red [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-rdx-red [animation-delay:300ms]" />
    </div>
  );
}

function findLatestId(
  messages: ChatMessage[],
  predicate: (m: ChatMessage) => boolean,
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && predicate(m)) return m.id;
  }
  return null;
}

export default function MessageList({
  messages,
  isTyping,
  region,
  failedListingIds,
  onListingFailed,
  onCartNotice,
  onAddedToCart,
  onOptionSelect,
  scrollRef,
}: MessageListProps) {
  const showMenuHint = messages.filter((m) => m.role === "user").length >= 1;
  const latestAssistantId = findLatestId(
    messages,
    (m) => m.role === "assistant",
  );
  const latestMenuId = findLatestId(
    messages,
    (m) => m.role === "assistant" && Boolean(m.showMenu),
  );

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto bg-neutral-100 px-4 py-4"
      aria-live="polite"
      aria-busy={isTyping}
    >
      {messages.length === 0 && !isTyping && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm font-medium text-neutral-700">
            Start a conversation
          </p>
          <p className="text-xs text-neutral-500">
            Ask about gloves, sizes, or training gear.
          </p>
        </div>
      )}

      {messages.map((message) => {
        const isLatestAssistant = message.id === latestAssistantId;
        const products =
          message.role === "assistant" ? collectDisplayProducts(message) : [];
        // const citations =
        //   message.role === "assistant"
        //     ? nonProductCitations(message.citations)
        //     : [];

        return (
          <div key={message.id} className="w-full">
            <div
              className={
                message.role === "user"
                  ? "ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-rdx-red px-3.5 py-2.5 text-left text-sm leading-relaxed text-white"
                  : "mr-auto w-full max-w-[95%] rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3.5 py-3 text-left shadow-sm"
              }
            >
              {message.role === "assistant" ? (
                <>
                  <MessageContent
                    content={stripProductLinksFromAnswer(message.content)}
                  />
                  {message.escalated && (
                    <p className="mt-2 text-[11px] font-medium text-slate-700">
                      A person is taking over this conversation.
                    </p>
                  )}
                  {products.map((product) => (
                    <ProductCard
                      key={`${message.id}-${product.listing_id ?? product.handle}`}
                      product={product}
                      region={region}
                      failedListingIds={failedListingIds}
                      onListingFailed={onListingFailed}
                      onNotice={onCartNotice}
                      onAdded={onAddedToCart}
                    />
                  ))}
                  {/* {citations.length > 0 && (
                    <CitationList citations={citations} />
                  )} */}
                  {message.attachments?.map((attachment, index) =>
                    attachment.kind === "size_chart" ? (
                      <SizeChartAttachment
                        key={`${message.id}-chart-${index}`}
                        attachment={attachment}
                      />
                    ) : null,
                  )}
                </>
              ) : (
                message.content
              )}
            </div>

            {message.role === "assistant" &&
              message.showMenu &&
              message.id === latestMenuId && (
                <OptionButtons disabled={isTyping} onSelect={onOptionSelect} />
              )}

            {isLatestAssistant && !message.showMenu && showMenuHint && (
              <p className="mt-1.5 px-1 text-left text-[11px] text-neutral-400">
                Reply with{" "}
                <span className="font-semibold text-neutral-600">M</span> for the
                main menu
              </p>
            )}
          </div>
        );
      })}

      {isTyping && <TypingIndicator />}
    </div>
  );
}
