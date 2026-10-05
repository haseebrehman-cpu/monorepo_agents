import { useCallback, useState } from "react";
import type { ChatProductCard } from "@rdx/chat-contract";
import { MARKETPLACE_CURRENCY } from "@/lib/cart-api";
import { formatDecimalPrice } from "@/lib/cart-money";
import { readMarketplace } from "@/lib/chat-api";
import type { CartNotice } from "@/lib/cart-outcome";
import { isAllowedChatHref, isAllowedImageUrl } from "@/lib/url-allowlist";
import { useAddToCart } from "@/lib/use-add-to-cart";
import {
  selectedSizeColorLabel,
  type VariantSelection,
} from "@/lib/variant-selection";
import VariantSelector from "./VariantSelector";

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
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorHidden, setSelectorHidden] = useState(false);
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const [selection, setSelection] = useState<VariantSelection>({});
  const { add, pending } = useAddToCart(region, onNotice, onListingFailed);

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
  const selectedImage = isAllowedImageUrl(variantImage ?? undefined)
    ? variantImage
    : null;
  const cardImage = isAllowedImageUrl(product.image_url ?? undefined)
    ? product.image_url
    : null;
  const image = selectedImage ?? cardImage;
  const promotion = product.promotions?.[0];
  const listingId = product.listing_id?.trim() || "";
  const soldOut = product.availability === "false";
  const blocked = Boolean(listingId && failedListingIds.has(listingId));
  const hasVariants =
    product.has_variants === true && Boolean(listingId) && !selectorHidden;
  const currency =
    product.price_currency || MARKETPLACE_CURRENCY[readMarketplace(region)];
  const canAddToCart =
    product.availability === "true" && Boolean(listingId) && !blocked && !pending;

  const hideSelector = useCallback(() => {
    setSelectorHidden(true);
    setSelectorOpen(false);
    setVariantImage(null);
    setSelection({});
  }, []);

  const showVariantImage = useCallback((imageUrl: string | null) => {
    setVariantImage(imageUrl);
  }, []);

  const showSelection = useCallback((next: VariantSelection) => {
    setSelection((prev) => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
      for (const key of keys) {
        if (prev[key] !== next[key]) return next;
      }
      return prev;
    });
  }, []);
  const pickedLabel = selectedSizeColorLabel(selection);

  return (
    <article className="rdx-product-card mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
      {image && (
        <img
          src={image}
          alt={product.image_alt || product.title}
          className="rdx-product-image mb-2 h-44 w-full rounded-md bg-white object-contain"
        />
      )}
      <div className="rdx-product-body min-w-0">
        <h3 className="rdx-product-title text-[13px] font-semibold text-slate-900">
          {product.title}
        </h3>
        {current ? (
          <p className="rdx-product-price mt-1 text-[13px] text-slate-800">
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
        ) : (
          <p className="rdx-product-price mt-1 text-[13px] text-slate-600">
            See product page
          </p>
        )}
        {(product.stock_status || pickedLabel) && (
          <p className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-slate-600">
            <span>{product.stock_status}</span>
            {pickedLabel && (
              <span className="shrink-0 text-right text-slate-700">{pickedLabel}</span>
            )}
          </p>
        )}
        {promotion && (
          <p className="mt-0.5 text-[12px] font-medium text-rdx-red">{promotion}</p>
        )}
        <div className="rdx-product-actions mt-2.5 flex items-center gap-2 border-t border-slate-200/80 pt-2.5">
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
          {hasVariants ? (
            <button
              type="button"
              aria-expanded={selectorOpen}
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="inline-flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:ring-2 focus-visible:ring-rdx-red/40 focus-visible:ring-offset-1 focus-visible:outline-none"
            >
              <CartIcon />
              {selectorOpen ? "Hide options" : "Select options"}
            </button>
          ) : (
            listingId && (
              <button
                disabled={!canAddToCart}
                type="button"
                onClick={() =>
                  void add({
                    listingId,
                    price: product.price_min,
                    currency: product.price_currency,
                  })
                }
                className="inline-flex h-8 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:ring-2 focus-visible:ring-rdx-red/40 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rdx-red"
              >
                <CartIcon />
                {pending
                  ? "Adding…"
                  : soldOut || blocked
                    ? "Sold out"
                    : "Add to Cart"}
              </button>
            )
          )}
        </div>
        {hasVariants && selectorOpen && (
          <VariantSelector
            listingId={listingId}
            region={region}
            currency={currency}
            productHref={href}
            failedListingIds={failedListingIds}
            onListingFailed={onListingFailed}
            onNotice={onNotice}
            onUnavailable={hideSelector}
            onImageChange={showVariantImage}
            onSelectionChange={showSelection}
          />
        )}
      </div>
    </article>
  );
}
