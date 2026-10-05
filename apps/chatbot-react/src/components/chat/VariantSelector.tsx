import { useEffect, useState } from "react";
import type { ProductVariant } from "@rdx/chat-contract";
import { formatDecimalPrice } from "@/lib/cart-money";
import type { CartNotice } from "@/lib/cart-outcome";
import { useAddToCart } from "@/lib/use-add-to-cart";
import {
  isSelectorUnavailable,
  useProductVariants,
} from "@/lib/use-product-variants";
import {
  initialSelection,
  matchedVariant,
  missingOptions,
  optionValueState,
  orderedOptions,
  previewImageUrl,
  priceRange,
  selectValue,
  type VariantSelection,
} from "@/lib/variant-selection";

function listPrompt(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function availabilityNote(variant: ProductVariant): string | null {
  if (variant.purchasable) return null;
  if (variant.available === false) return "Sold out";
  if (variant.price === null) return "Price unavailable";
  return "Unavailable";
}

const VALUE_CLASS: Record<string, string> = {
  selected: "border-rdx-red bg-rdx-red text-white",
  available:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100",
  sold_out:
    "border-dashed border-slate-200 bg-white text-slate-400 line-through",
  missing: "border-slate-100 bg-slate-50 text-slate-300",
};

export default function VariantSelector({
  listingId,
  region,
  currency,
  productHref,
  failedListingIds,
  onListingFailed,
  onNotice,
  onUnavailable,
  onImageChange,
  onSelectionChange,
}: {
  /** The card's default selection — also the id the selector is opened with. */
  listingId: string;
  region: string;
  currency: string;
  productHref: string | null;
  failedListingIds: Set<string>;
  onListingFailed: (listingId: string) => void;
  onNotice: (notice: CartNotice) => void;
  onUnavailable: () => void;
  onImageChange: (imageUrl: string | null) => void;
  onSelectionChange: (selection: VariantSelection) => void;
}) {
  const query = useProductVariants(listingId, region, true);
  /** `null` until the shopper picks — the card's default applies until then. */
  const [picked, setPicked] = useState<VariantSelection | null>(null);
  const { add, pending } = useAddToCart(region, onNotice, onListingFailed);

  const options = orderedOptions(query.data?.options);
  const variants = query.data?.variants ?? [];

  const selection =
    picked ?? initialSelection(variants, query.data?.listing_id);

  useEffect(() => {
    if (isSelectorUnavailable(query.error)) onUnavailable();
  }, [query.error, onUnavailable]);

  const previewImage = query.data?.live
    ? previewImageUrl(variants, selection)
    : null;

  useEffect(() => {
    onImageChange(previewImage);
  }, [previewImage, onImageChange]);

  useEffect(() => {
    if (!query.data?.live) return;
    onSelectionChange(
      picked ?? initialSelection(query.data.variants, query.data.listing_id),
    );
  }, [query.data, picked, onSelectionChange]);

  if (query.isPending) {
    return (
      <p className="mt-2.5 border-t border-slate-200/80 pt-2.5 text-[12px] text-slate-500">
        Loading options…
      </p>
    );
  }

  if (query.error) {
    if (isSelectorUnavailable(query.error)) return null;
    return (
      <div className="mt-2.5 border-t border-slate-200/80 pt-2.5">
        <p className="text-[12px] text-slate-600">
          Options could not be loaded.
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-1.5 text-[12px] font-semibold text-rdx-red hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Live read unavailable: never fall back to the card's or a cached price.
  if (!query.data?.live) {
    return (
      <div className="mt-2.5 border-t border-slate-200/80 pt-2.5">
        <p className="text-[12px] text-slate-600">
          Price and availability are currently unavailable
          {productHref ? (
            <>
              {" — "}
              <a
                href={productHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-rdx-red hover:underline"
              >
                see the product page
              </a>
            </>
          ) : (
            "."
          )}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-1.5 text-[12px] font-semibold text-rdx-red hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const match = matchedVariant(options, variants, selection);
  const matchPrice = formatDecimalPrice(match?.price ?? null, currency);
  const matchCompare = formatDecimalPrice(
    match?.compare_at_price ?? null,
    currency,
  );
  const range = priceRange(variants);
  const rangeLabel =
    range.min && range.max
      ? range.min === range.max
        ? formatDecimalPrice(range.min, currency)
        : `${formatDecimalPrice(range.min, currency)} – ${formatDecimalPrice(range.max, currency)}`
      : null;
  const pickPrompt = listPrompt(
    missingOptions(options, selection).map((option) =>
      option.label.toLowerCase(),
    ),
  );
  const matchListingId = match?.listing_id ?? "";
  const blocked = Boolean(matchListingId && failedListingIds.has(matchListingId));
  const note = match ? availabilityNote(match) : null;
  const canAdd = Boolean(
    match?.purchasable && matchListingId && !blocked && !pending,
  );

  return (
    <div className="rdx-variant-selector mt-2.5 border-t border-slate-200/80 pt-2.5">
      {options.map((option) => (
        <div key={option.key} className="mb-2 last:mb-0">
          <p
            className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
            id={`rdx-option-${listingId}-${option.key}`}
          >
            {option.label}
          </p>
          <div
            className="mt-1 flex flex-wrap gap-1.5"
            role="group"
            aria-labelledby={`rdx-option-${listingId}-${option.key}`}
          >
            {option.values.map((value) => {
              const state = optionValueState(
                variants,
                selection,
                option.key,
                value,
              );
              const selected = selection[option.key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  disabled={state === "missing"}
                  onClick={() =>
                    setPicked(
                      selectValue(
                        options,
                        variants,
                        selection,
                        option.key,
                        value,
                      ),
                    )
                  }
                  className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition disabled:cursor-not-allowed ${
                    VALUE_CLASS[selected ? "selected" : state]
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="mt-2 text-[13px] text-slate-800">
        {match && matchPrice ? (
          <>
            <span className="font-semibold">{matchPrice}</span>
            {matchCompare && (
              <span className="ml-2 text-slate-400 line-through">
                {matchCompare}
              </span>
            )}
            {note && <span className="ml-2 text-[12px] text-slate-500">{note}</span>}
          </>
        ) : (
          <>
            {rangeLabel ? (
              <span className="font-semibold">{rangeLabel}</span>
            ) : (
              <span className="text-slate-600">Price unavailable</span>
            )}
            {pickPrompt && (
              <span className="ml-2 text-[12px] text-slate-500">
                Select a {pickPrompt}
              </span>
            )}
          </>
        )}
      </p>

      <button
        type="button"
        disabled={!canAdd}
        onClick={() =>
          void add({
            listingId: matchListingId,
            price: match?.price ?? null,
            currency,
          })
        }
        className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:ring-2 focus-visible:ring-rdx-red/40 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rdx-red"
      >
        {pending
          ? "Adding…"
          : !match
            ? "Add to Cart"
            : blocked || !match.purchasable
              ? (note ?? "Unavailable")
              : "Add to Cart"}
      </button>
    </div>
  );
}
