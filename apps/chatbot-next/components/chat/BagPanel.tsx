import Image from "next/image";
import type { SupportCart } from "@rdx/chat-contract";
import { formatMoney } from "@/lib/chat/format";
import { isSafeHref } from "@/lib/chat/links";
import { ArrowLeftIcon, BagIcon, GloveGlyph, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import Spinner from "./Spinner";

interface BagPanelProps {
  cart: SupportCart;
  isLoading: boolean;
  pendingVariantId: string | null;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  onCheckout: (checkoutUrl: string) => void;
  onClose: () => void;
}

export default function BagPanel({
  cart,
  isLoading,
  pendingVariantId,
  onQuantityChange,
  onRemove,
  onCheckout,
  onClose,
}: BagPanelProps) {
  const empty = cart.items.length === 0;
  const checkoutUrl = isSafeHref(cart.checkout_url) ? cart.checkout_url : null;
  const busy = pendingVariantId !== null;

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
            {cart.item_count} {cart.item_count === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div className="rdx-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mx-auto group-data-[expanded=true]/panel:max-w-3xl">
          {isLoading ? (
            <div className="flex justify-center pt-12">
              <Spinner className="h-6 w-6 border-neutral-300 border-t-neutral-700" />
            </div>
          ) : empty ? (
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
              {cart.items.map((line) => {
                const lineBusy = pendingVariantId === line.variant_id;
                const amount = line.total ?? (line.price != null ? line.price * line.quantity : null);
                return (
                  <li key={line.variant_id} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200">
                      {line.image_url && isSafeHref(line.image_url) ? (
                        <Image src={line.image_url} alt="" fill unoptimized sizes="64px" className="object-contain p-1" />
                      ) : (
                        <GloveGlyph className="h-9 w-9" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-semibold text-neutral-900">
                        {line.title?.trim() || "Item"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-neutral-200">
                          <button
                            type="button"
                            disabled={lineBusy || line.quantity <= 1}
                            onClick={() => onQuantityChange(line.variant_id, line.quantity - 1)}
                            aria-label={`Decrease quantity of ${line.title ?? "item"}`}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <MinusIcon className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-semibold text-neutral-900">{line.quantity}</span>
                          <button
                            type="button"
                            disabled={lineBusy || line.quantity >= 99}
                            onClick={() => onQuantityChange(line.variant_id, line.quantity + 1)}
                            aria-label={`Increase quantity of ${line.title ?? "item"}`}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {amount !== null && cart.currency && (
                          <span className="text-[13px] font-semibold text-neutral-900">
                            {formatMoney(amount, cart.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={lineBusy}
                      onClick={() => onRemove(line.variant_id)}
                      aria-label={`Remove ${line.title ?? "item"}`}
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center self-start rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-rdx-red disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {!empty && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3">
          <div className="mx-auto group-data-[expanded=true]/panel:max-w-3xl">
            {cart.currency && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-neutral-500">Total</span>
                <span className="text-base font-bold text-neutral-900">{formatMoney(cart.total, cart.currency)}</span>
              </div>
            )}
            <p className="mt-0.5 text-[11px] text-neutral-400">
              Shipping and tax are calculated on the store checkout. No order is placed until you finish there.
            </p>
            <button
              type="button"
              disabled={!checkoutUrl || busy}
              onClick={() => checkoutUrl && onCheckout(checkoutUrl)}
              className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center rounded-full bg-rdx-red text-sm font-semibold text-white transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Updating bag…" : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
