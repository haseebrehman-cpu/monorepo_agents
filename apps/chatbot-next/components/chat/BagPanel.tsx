import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { SupportCart } from "@rdx/chat-contract";
import { formatMoney } from "@/lib/chat/format";
import { isSafeHref } from "@/lib/chat/links";
import { ArrowLeftIcon, BagIcon, ExternalIcon, GloveGlyph, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import Spinner from "./Spinner";

interface BagPanelProps {
  cart: SupportCart;
  isLoading: boolean;
  isClearing: boolean;
  pendingVariantId: string | null;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  onEmpty: () => Promise<unknown>;
  onCheckout: (checkoutUrl: string) => void;
  onClose: () => void;
}

export default function BagPanel({
  cart,
  isLoading,
  isClearing,
  pendingVariantId,
  onQuantityChange,
  onRemove,
  onEmpty,
  onCheckout,
  onClose,
}: BagPanelProps) {
  const empty = cart.items.length === 0;
  const checkoutUrl = isSafeHref(cart.checkout_url) ? cart.checkout_url : null;
  const busy = pendingVariantId !== null || isClearing;
  const [confirming, setConfirming] = useState(false);
  const confirmTitleId = useId();
  const confirmDescId = useId();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const emptyingRef = useRef(false);
  const clearingRef = useRef(isClearing);
  clearingRef.current = isClearing;
  const showConfirm = confirming && !empty;
  const itemLabel = `${cart.item_count} ${cart.item_count === 1 ? "item" : "items"}`;

  useEffect(() => {
    if (empty) setConfirming(false);
  }, [empty]);

  useEffect(() => {
    if (!showConfirm) return;
    const node = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    keepRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Capture phase so Escape dismisses this dialog before the chat widget closes.
        event.preventDefault();
        event.stopPropagation();
        if (clearingRef.current) return;
        setConfirming(false);
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previouslyFocused?.focus();
    };
  }, [showConfirm]);

  const requestEmpty = () => {
    if (isClearing || emptyingRef.current) return;
    emptyingRef.current = true;
    void onEmpty().finally(() => {
      emptyingRef.current = false;
    });
  };

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
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-neutral-500">{itemLabel}</span>
            <button
              type="button"
              aria-label="Empty bag"
              aria-expanded={showConfirm}
              aria-controls={showConfirm ? dialogId : undefined}
              disabled={isClearing || (busy && !showConfirm)}
              onClick={() => {
                if (isClearing) return;
                setConfirming((open) => !open);
              }}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                showConfirm
                  ? "bg-red-50 text-rdx-red"
                  : "text-neutral-500 hover:bg-red-50 hover:text-rdx-red"
              }`}
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Empty
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {showConfirm && (
          <div
            className="absolute inset-0 z-20 flex items-start justify-center bg-neutral-900/25 px-4 pt-8 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isClearing) setConfirming(false);
            }}
          >
            <div
              ref={dialogRef}
              id={dialogId}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={confirmTitleId}
              aria-describedby={confirmDescId}
              className="w-full max-w-sm animate-rdx-rise rounded-2xl bg-white p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-rdx-red">
                  <TrashIcon className="h-4 w-4" />
                </span>
                <p id={confirmTitleId} className="text-sm font-semibold text-neutral-900">
                  Empty your bag?
                </p>
              </div>
              <p id={confirmDescId} className="mt-3 text-xs leading-relaxed text-neutral-500">
                This removes {itemLabel}. You can add {cart.item_count === 1 ? "it" : "them"} again from the chat.
              </p>
              {isClearing && (
                <p role="status" className="mt-3 text-xs font-medium text-neutral-600">
                  Removing {itemLabel}…
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  ref={keepRef}
                  type="button"
                  disabled={isClearing}
                  onClick={() => setConfirming(false)}
                  className="h-9 flex-1 cursor-pointer rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Keep items
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={requestEmpty}
                  className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-rdx-red text-xs font-semibold text-white transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isClearing ? (
                    <>
                      <Spinner />
                      Emptying…
                    </>
                  ) : (
                    "Empty bag"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="rdx-scroll h-full overflow-y-auto px-4 py-3">
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
                const lineBusy = isClearing || pendingVariantId === line.variant_id;
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
      </div>

      {!empty && (
        <div
          className={`border-t border-neutral-200 bg-white px-4 py-3 transition ${
            showConfirm ? "pointer-events-none opacity-40" : ""
          }`}
        >
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
              disabled={!checkoutUrl || busy || showConfirm}
              onClick={() => checkoutUrl && onCheckout(checkoutUrl)}
              className="mt-3 flex h-10 w-full cursor-pointer items-center justify-center rounded-full bg-rdx-red text-sm font-semibold text-white transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? "Emptying bag…" : busy ? "Updating bag…" : "Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Shown after checkout opens in another tab, because that tab never reports whether the shopper paid. */
export function CheckoutFollowUp({
  itemCount,
  isClearing,
  onKeep,
  onEmpty,
}: {
  itemCount: number;
  isClearing: boolean;
  onKeep: () => void;
  onEmpty: () => Promise<unknown>;
}) {
  const itemLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const clearingRef = useRef(isClearing);
  const emptyingRef = useRef(false);
  clearingRef.current = isClearing;

  useEffect(() => {
    const node = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    keepRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (clearingRef.current) return;
        onKeep();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previouslyFocused?.focus();
    };
  }, [onKeep]);

  const requestEmpty = () => {
    if (isClearing || emptyingRef.current) return;
    emptyingRef.current = true;
    void onEmpty().finally(() => {
      emptyingRef.current = false;
    });
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-900/45 px-5 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isClearing) onKeep();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-sm animate-rdx-rise rounded-2xl bg-white p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/5"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
            <ExternalIcon className="h-4 w-4" />
          </span>
          <p id={titleId} className="text-sm font-semibold text-neutral-900">
            Finished on the store?
          </p>
        </div>
        <p id={descId} className="mt-3 text-xs leading-relaxed text-neutral-500">
          Checkout opened in another tab. This chat can't see whether you paid, so your bag still has {itemLabel}. Empty
          it if you're done, or keep {itemCount === 1 ? "it" : "them"} if you left checkout.
        </p>
        {isClearing && (
          <p role="status" className="mt-3 text-xs font-medium text-neutral-600">
            Removing {itemLabel}…
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            ref={keepRef}
            type="button"
            disabled={isClearing}
            onClick={onKeep}
            className="h-9 flex-1 cursor-pointer rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep items
          </button>
          <button
            type="button"
            disabled={isClearing}
            onClick={requestEmpty}
            className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-rdx-red text-xs font-semibold text-white transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isClearing ? (
              <>
                <Spinner />
                Emptying…
              </>
            ) : (
              "Empty bag"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
