import { useState } from "react";
import { ApiError } from "@rdx/api-client";
import type { ChatProductCard } from "@rdx/chat-contract";
import { MARKETPLACE_CURRENCY, newCartActionId, toMinorUnits } from "@/lib/cart-api";
import { formatDecimalPrice } from "@/lib/cart-money";
import { noticeFromCartAction, type CartNotice } from "@/lib/cart-outcome";
import { readMarketplace } from "@/lib/chat-api";
import { isAllowedChatHref, isAllowedImageUrl } from "@/lib/url-allowlist";
import { useAddCartLine } from "@/lib/use-cart";

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 shrink-0"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13 5.4 5M7 13l-2 6h13M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      />
    </svg>
  );
}

export default function ProductCard({
  product,
  region,
  failedListingIds,
  onListingFailed,
  onNotice,
}: {
  product: ChatProductCard;
  region: string;
  failedListingIds: Set<string>;
  onListingFailed: (listingId: string) => void;
  onNotice: (notice: CartNotice) => void;
}) {
  const addLine = useAddCartLine(region);
  const [pending, setPending] = useState(false);
  const current = formatDecimalPrice(product.price_min, product.price_currency);
  const compare = formatDecimalPrice(
    product.compare_at_min,
    product.price_currency,
  );
  const showWas =
    product.compare_at_min !== null &&
    product.price_min !== null &&
    Number.parseFloat(product.compare_at_min) >
      Number.parseFloat(product.price_min);
  const href = isAllowedChatHref(product.url) ? product.url : null;
  const image = isAllowedImageUrl(product.image_url ?? undefined)
    ? product.image_url
    : null;
  const promotion = product.promotions?.[0];
  const listingId = product.listing_id?.trim() || "";
  const soldOut = product.availability === "false";
  const blocked = Boolean(listingId && failedListingIds.has(listingId));
  const canAddToCart =
    product.availability === "true" && Boolean(listingId) && !blocked && !pending;

  const handleAdd = async () => {
    if (!canAddToCart || !listingId) return;
    const marketplace = readMarketplace(region);
    const quotedUnitAmount = toMinorUnits(product.price_min);
    const quotedCurrency =
      product.price_currency || MARKETPLACE_CURRENCY[marketplace];
    const actionId = newCartActionId();

    setPending(true);
    try {
      const result = await addLine.mutateAsync({
        listingId,
        quantity: 1,
        quotedUnitAmount,
        quotedCurrency,
        actionId,
      });
      onNotice(noticeFromCartAction(result, "add"));
      if (result.outcome === "failed") {
        onListingFailed(listingId);
        return;
      }
    } catch (error) {
      onNotice({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Could not add this item. Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
      {image && (
        <img
          src={image}
          alt={product.image_alt || product.title}
          className="mb-2 h-50 w-full rounded-md object-fill"
        />
      )}
      <h3 className="text-[13px] font-semibold text-slate-900">{product.title}</h3>
      {current && (
        <p className="mt-1 text-[13px] text-slate-800">
          <span className="font-semibold">{current}</span>
          {product.price_max &&
            product.price_min &&
            product.price_max !== product.price_min && (
              <span className="text-slate-600">
                {" "}
                – {formatDecimalPrice(product.price_max, product.price_currency)}
              </span>
            )}
          {showWas && compare && (
            <span className="ml-2 text-slate-400 line-through">{compare}</span>
          )}
        </p>
      )}
      {product.stock_status && (
        <p className="mt-0.5 text-[12px] text-slate-600">{product.stock_status}</p>
      )}
      {promotion && (
        <p className="mt-0.5 text-[12px] font-medium text-rdx-red">{promotion}</p>
      )}
      <div className="mt-2.5 flex items-center gap-2 border-t border-slate-200/80 pt-2.5">
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 min-w-0 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
          >
            View product
          </a>
        )}
        {listingId && (
          <button
            disabled={!canAddToCart}
            type="button"
            onClick={() => void handleAdd()}
            className="inline-flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rdx-red/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rdx-red"
          >
            <CartIcon />
            {pending
              ? "Adding…"
              : soldOut || blocked
                ? "Sold out"
                : "Add to Cart"}
          </button>
        )}
      </div>
    </article>
  );
}
