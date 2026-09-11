import { useState } from "react";
import { ApiError } from "@rdx/api-client";
import type {
  CartActionResponse,
  CartLine,
  CartSnapshot,
} from "@rdx/chat-contract";
import { formatMinorUnits } from "@/lib/cart-money";
import { noticeFromCartAction, type CartNotice } from "@/lib/cart-outcome";
import { isAllowedChatHref, isAllowedImageUrl } from "@/lib/url-allowlist";
import {
  useChangeCartLine,
  useCheckout,
  useRemoveCartLine,
} from "@/lib/use-cart";

function CartNoticeBanner({ notice }: { notice: CartNotice }) {
  const tone =
    notice.kind === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : notice.kind === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : notice.kind === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <p className={`rounded-lg border px-3 py-2 text-[12px] ${tone}`} role="status">
      {notice.text}
    </p>
  );
}

function LineRow({
  line,
  busy,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const image = isAllowedImageUrl(line.image_url ?? undefined)
    ? line.image_url
    : null;
  const href = isAllowedChatHref(line.product_url ?? undefined)
    ? line.product_url
    : null;
  const price = formatMinorUnits(line.line_amount, line.currency);

  return (
    <article className="flex gap-3 border-b border-neutral-100 py-3 last:border-b-0">
      {image ? (
        <img
          src={image}
          alt=""
          className="h-16 w-16 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-md bg-neutral-100" />
      )}
      <div className="min-w-0 flex-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-[13px] font-semibold text-slate-900 hover:underline"
          >
            {line.title}
          </a>
        ) : (
          <p className="truncate text-[13px] font-semibold text-slate-900">
            {line.title}
          </p>
        )}
        {line.sku && (
          <p className="truncate text-[11px] text-neutral-500">{line.sku}</p>
        )}
        {price && (
          <p className="mt-0.5 text-[13px] font-medium text-slate-800">{price}</p>
        )}
        {line.available === false && (
          <p className="text-[11px] text-amber-700">No longer available</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
            <button
              type="button"
              className="cursor-pointer h-7 w-7 text-sm text-slate-700 disabled:opacity-40"
              disabled={busy || line.quantity <= 1}
              aria-label={`Decrease quantity of ${line.title}`}
              onClick={() => onQuantity(line.quantity - 1)}
            >
              −
            </button>
            <span className="min-w-6 text-center text-[12px] font-medium text-slate-800">
              {line.quantity}
            </span>
            <button
              type="button"
              className="cursor-pointer h-7 w-7 text-sm text-slate-700 disabled:opacity-40"
              disabled={busy || line.quantity >= 100}
              aria-label={`Increase quantity of ${line.title}`}
              onClick={() => onQuantity(line.quantity + 1)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-rdx-red disabled:opacity-40"
            disabled={busy}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CartPanel({
  region,
  cart,
  notice,
  onNotice,
  onClose,
}: {
  region: string;
  cart: CartSnapshot | undefined;
  notice: CartNotice | null;
  onNotice: (notice: CartNotice | null) => void;
  onClose: () => void;
}) {
  const changeLine = useChangeCartLine(region);
  const removeLine = useRemoveCartLine(region);
  const checkout = useCheckout(region);
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const lines = cart?.lines ?? [];
  const empty = cart?.empty ?? lines.length === 0;
  const currency = cart?.currency ?? lines[0]?.currency ?? "GBP";
  const total = formatMinorUnits(cart?.total ?? cart?.subtotal, currency);
  const frozen = Boolean(cart?.unresolved_action_id);
  const busy = changeLine.isPending || removeLine.isPending || checkout.isPending;

  const handleAction = async (
    lineRef: string,
    run: () => Promise<CartActionResponse>,
    context: "change" | "remove",
  ) => {
    setPendingRef(lineRef);
    try {
      const result = await run();
      onNotice(noticeFromCartAction(result, context));
    } catch (error) {
      onNotice({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Could not update your bag. Please try again.",
      });
    } finally {
      setPendingRef(null);
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await checkout.mutateAsync();
      onNotice(noticeFromCartAction(result, "checkout"));
      if (result.outcome === "succeeded" && result.checkout_url) {
        if (!isAllowedChatHref(result.checkout_url)) {
          onNotice({
            kind: "error",
            text: "Checkout link was blocked. Open the store to finish.",
          });
          return;
        }
        window.open(result.checkout_url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      onNotice({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Could not start checkout. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-neutral-100">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5">
        <p className="text-[13px] font-semibold text-slate-900">Your bag</p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-[12px] font-medium text-slate-600 hover:text-slate-900"
        >
          Back to chat
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {notice && <CartNoticeBanner notice={notice} />}
        {frozen && (
          <CartNoticeBanner
            notice={{
              kind: "warning",
              text: "We're not sure about a previous change. Check these items before adding more.",
            }}
          />
        )}

        {empty ? (
          <p className="pt-8 text-center text-[13px] text-neutral-500">
            Your bag is empty.
          </p>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white px-3">
            {lines.map((line) => (
              <LineRow
                key={line.line_ref}
                line={line}
                busy={busy && pendingRef === line.line_ref}
                onQuantity={(quantity) =>
                  void handleAction(
                    line.line_ref,
                    () =>
                      changeLine.mutateAsync({
                        lineRef: line.line_ref,
                        quantity,
                      }),
                    "change",
                  )
                }
                onRemove={() =>
                  void handleAction(
                    line.line_ref,
                    () => removeLine.mutateAsync({ lineRef: line.line_ref }),
                    "remove",
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-3">
        {total && !empty && (
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] text-neutral-500">
              {cart?.totals_are_estimates ? "Estimated total" : "Total"}
            </span>
            <span className="text-[15px] font-semibold text-slate-900">
              {total}
            </span>
          </div>
        )}
        {cart?.totals_are_estimates && !empty && (
          <p className="mb-2 text-[11px] text-neutral-500">
            Shipping and tax are calculated on the store checkout.
          </p>
        )}
        <button
          type="button"
          disabled={empty || frozen || checkout.isPending}
          onClick={() => void handleCheckout()}
          className="cursor-pointer flex h-10 w-full items-center justify-center rounded-lg bg-rdx-red text-[13px] font-semibold text-white transition hover:bg-rdx-red-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkout.isPending ? "Opening checkout…" : "Checkout"}
        </button>
      </div>
    </div>
  );
}
