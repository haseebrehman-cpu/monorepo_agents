import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { pageEventsQuery } from "@/lib/api/queries";
import type { Bag } from "@/lib/bag/bag-store";
import { formatMoney } from "@/lib/chat/format";
import { isSafeHref } from "@/lib/chat/links";
import { ArrowLeftIcon, BagIcon, ExternalIcon, GloveGlyph, MinusIcon, PlusIcon, TrashIcon } from "./icons";

interface BagPanelProps {
  store: SupportStoreCode;
  bag: Bag;
  conversationId: string | null;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClose: () => void;
}

function SharedActivity({ store, conversationId }: { store: SupportStoreCode; conversationId: string }) {
  const { data: events = [] } = useQuery(pageEventsQuery(store, conversationId));
  const recent = events.slice(-3).reverse();
  if (recent.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-3">
      <p className="text-[10px] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
        Shared with the assistant
      </p>
      <ul className="mt-1.5 space-y-1 text-xs text-neutral-600">
        {recent.map((event, index) => (
          <li key={index}>{event.summary || event.type.replace(/_/g, " ")}</li>
        ))}
      </ul>
    </section>
  );
}

export default function BagPanel({
  store,
  bag,
  conversationId,
  onQuantityChange,
  onRemove,
  onClose,
}: BagPanelProps) {
  const empty = bag.lines.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-100/70">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to chat"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeftIcon />
        </button>
        <p className="flex-1 text-sm font-semibold text-neutral-900">Your bag</p>
        {!empty && (
          <span className="text-xs text-neutral-500">
            {bag.itemCount} {bag.itemCount === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div className="rdx-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto group-data-[expanded=true]/panel:max-w-3xl">
          {empty ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm">
                <BagIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Your bag is empty</p>
                <p className="mt-0.5 text-xs text-neutral-500">Ask the assistant for gear and add it here.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full bg-rdx-red px-4 py-2 text-xs font-semibold text-white transition hover:bg-rdx-red-hover"
              >
                Start shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {bag.lines.map((line) => (
                <li key={line.productId} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200">
                    {line.imageUrl && isSafeHref(line.imageUrl) ? (
                      <Image src={line.imageUrl} alt="" fill unoptimized sizes="64px" className="object-contain p-1" />
                    ) : (
                      <GloveGlyph className="h-9 w-9" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-semibold text-neutral-900">{line.title}</p>
                    {isSafeHref(line.url) && (
                      <a
                        href={line.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-rdx-red hover:underline"
                      >
                        Buy on store <ExternalIcon className="h-3 w-3" />
                      </a>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-neutral-200">
                        <button
                          type="button"
                          disabled={line.quantity <= 1}
                          onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
                          aria-label={`Decrease quantity of ${line.title}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-xs font-semibold text-neutral-900">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={line.quantity >= 99}
                          onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
                          aria-label={`Increase quantity of ${line.title}`}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {line.priceFrom !== null && (
                        <span className="text-[13px] font-semibold text-neutral-900">
                          {formatMoney(line.priceFrom * line.quantity, line.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(line.productId)}
                    aria-label={`Remove ${line.title}`}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center self-start rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-rdx-red"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {conversationId && <SharedActivity store={store} conversationId={conversationId} />}
        </div>
      </div>

      {!empty && bag.currency && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3">
          <div className="mx-auto group-data-[expanded=true]/panel:max-w-3xl">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-500">Estimated from</span>
              <span className="text-base font-bold text-neutral-900">{formatMoney(bag.subtotal, bag.currency)}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Prices are &quot;from&quot; prices{bag.hasUnpriced ? " and some items have none" : ""}. Size,
              shipping and tax are chosen on the store.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
