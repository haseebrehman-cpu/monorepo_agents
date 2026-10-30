import type { SupportReply } from "@rdx/chat-contract";
import { useChatActions } from "./chat-context";
import InputRequestForm from "./InputRequestForm";
import Markdown from "./Markdown";
import ProductCard from "./ProductCard";
import ReplyMenu from "./ReplyMenu";
import SourceList from "./SourceList";
import TrackingForm from "./TrackingForm";

interface AssistantReplyProps {
  reply: SupportReply;
  isLatest: boolean;
}

function HandoffNotice({ reference }: { reference?: string | null }) {
  return (
    <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
      Passed to our support team
      {reference && <span className="font-mono font-medium text-emerald-800">· Ref {reference}</span>}
    </p>
  );
}

/** The bubble body for one reply, rendered by `reply.type`. */
export function ReplyBody({ reply, isLatest }: AssistantReplyProps) {
  const { store, isTyping, send } = useChatActions();
  const interactive = isLatest && !isTyping;

  return (
    <>
      <Markdown content={reply.text} />
      {reply.handoff && <HandoffNotice reference={reply.handoff.reference} />}

      {reply.type === "action" && reply.action?.name === "track_order" && (
        <TrackingForm
          store={store}
          initialOrderNumber={reply.action.order_number}
          disabled={isTyping}
          onAskAgent={(message) => send(message)}
        />
      )}

      {reply.type === "menu" && reply.menu && (
        <ReplyMenu
          menu={reply.menu}
          disabled={!interactive}
          onSelect={(item) => send(item.message, { menuChoice: item.id })}
        />
      )}

      {reply.type === "input_request" && reply.input && isLatest && (
        <InputRequestForm input={reply.input} disabled={isTyping} onAnswer={(text) => send(text)} />
      )}

      {reply.sources && reply.sources.length > 0 && <SourceList sources={reply.sources} />}
    </>
  );
}

export function ReplyProducts({ reply }: { reply: SupportReply }) {
  const { addToBag, viewProduct, quantityInBag } = useChatActions();
  const products = reply.products ?? [];
  if (products.length === 0) return null;

  return (
    <div className="rdx-scroll -mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-2 group-data-[expanded=true]/panel:grid group-data-[expanded=true]/panel:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] group-data-[expanded=true]/panel:overflow-visible">
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          product={product}
          quantityInBag={quantityInBag(product.product_id)}
          onAdd={addToBag}
          onView={viewProduct}
        />
      ))}
    </div>
  );
}
