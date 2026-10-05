import type {
  ProductSelectorOption,
  ProductVariant,
} from "@rdx/chat-contract";

/** Option key -> chosen value. */
export type VariantSelection = Record<string, string>;

export type OptionValueState = "available" | "sold_out" | "missing";

/** Options in the store's order; values are already sorted by the API. */
export function orderedOptions<T extends { position: number }>(
  options: T[] | null | undefined,
): T[] {
  return [...(options ?? [])].sort((a, b) => a.position - b.position);
}

function matchesSelection(
  variant: ProductVariant,
  selection: VariantSelection,
): boolean {
  return Object.entries(selection).every(
    ([key, value]) => variant.options[key] === value,
  );
}

/** Variants that have `value` for `optionKey` and keep every other pick. */
export function candidatesFor(
  variants: ProductVariant[],
  selection: VariantSelection,
  optionKey: string,
  value: string,
): ProductVariant[] {
  const others = { ...selection };
  delete others[optionKey];
  return variants.filter(
    (variant) =>
      variant.options[optionKey] === value && matchesSelection(variant, others),
  );
}

export function optionValueState(
  variants: ProductVariant[],
  selection: VariantSelection,
  optionKey: string,
  value: string,
): OptionValueState {
  const candidates = candidatesFor(variants, selection, optionKey, value);
  if (candidates.length === 0) return "missing";
  return candidates.some((variant) => variant.purchasable)
    ? "available"
    : "sold_out";
}

/** The values of the default variant, so the card's preselection is kept. */
export function initialSelection(
  variants: ProductVariant[],
  listingId: string | null | undefined,
): VariantSelection {
  const target = listingId?.trim();
  if (!target) return {};
  const variant = variants.find((item) => item.listing_id === target);
  return variant ? { ...variant.options } : {};
}

/**
 * Apply a pick, dropping any earlier pick that the new one rules out (Blue
 * exists in 12oz only, so picking Blue clears a 14oz size).
 */
export function selectValue(
  options: ProductSelectorOption[],
  variants: ProductVariant[],
  selection: VariantSelection,
  optionKey: string,
  value: string,
): VariantSelection {
  const next: VariantSelection = { [optionKey]: value };
  for (const option of orderedOptions(options)) {
    if (option.key === optionKey) continue;
    const kept = selection[option.key];
    if (!kept) continue;
    const candidate = { ...next, [option.key]: kept };
    if (variants.some((variant) => matchesSelection(variant, candidate))) {
      next[option.key] = kept;
    }
  }
  return next;
}

export function isSelectionComplete(
  options: ProductSelectorOption[],
  selection: VariantSelection,
): boolean {
  const keys = orderedOptions(options).map((option) => option.key);
  return keys.length > 0 && keys.every((key) => Boolean(selection[key]));
}

/** The one variant the shopper has chosen, or `null` while it is ambiguous. */
export function matchedVariant(
  options: ProductSelectorOption[],
  variants: ProductVariant[],
  selection: VariantSelection,
): ProductVariant | null {
  // Single-variant product: no options to pick, the lone variant is the match.
  if (orderedOptions(options).length === 0) {
    return variants.length === 1 ? variants[0] : null;
  }
  if (!isSelectionComplete(options, selection)) return null;
  const matches = variants.filter((variant) =>
    matchesSelection(variant, selection),
  );
  return matches.length === 1 ? matches[0] : null;
}

/** Option keys still to pick, in the store's order — used for the prompt. */
export function missingOptions(
  options: ProductSelectorOption[],
  selection: VariantSelection,
): ProductSelectorOption[] {
  return orderedOptions(options).filter((option) => !selection[option.key]);
}

/**
 * Image for the current picks. A colour change updates the photo even before
 * every other option is chosen.
 */
export function previewImageUrl(
  variants: ProductVariant[],
  selection: VariantSelection,
): string | null {
  if (Object.keys(selection).length === 0) return null;
  const matching = variants.filter((variant) =>
    matchesSelection(variant, selection),
  );
  for (const variant of matching) {
    const url = variant.image_url?.trim();
    if (url) return url;
  }
  return null;
}

/** Size and colour for the card row, in a single right-aligned label. */
export function selectedSizeColorLabel(selection: VariantSelection): string {
  const color = selection.colour ?? selection.color;
  const size = selection.size;
  return [color, size].filter(Boolean).join(" · ");
}

/** Live price of the current picks, for the product card. */
export type VariantPricePreview = {
  min: string | null;
  max: string | null;
  compareAt: string | null;
};

/** Price span of the variants that still match the current picks. */
export function pricesForSelection(
  variants: ProductVariant[],
  selection: VariantSelection,
): { min: string | null; max: string | null } {
  const matching =
    Object.keys(selection).length === 0
      ? variants
      : variants.filter((variant) => matchesSelection(variant, selection));
  return priceRange(matching);
}

/**
 * Exact price once one variant is chosen; otherwise the range of the variants
 * those picks still allow. Compare-at is only meaningful for one variant.
 */
export function variantPricePreview(
  options: ProductSelectorOption[],
  variants: ProductVariant[],
  selection: VariantSelection,
): VariantPricePreview {
  const match = matchedVariant(options, variants, selection);
  if (match) {
    return {
      min: match.price,
      max: match.price,
      compareAt: match.compare_at_price,
    };
  }
  const range = pricesForSelection(variants, selection);
  return { min: range.min, max: range.max, compareAt: null };
}

export function priceRange(variants: ProductVariant[]): {
  min: string | null;
  max: string | null;
} {
  const priced = variants
    .map((variant) => variant.price)
    .filter((price): price is string => Boolean(price))
    .map((price) => ({ price, amount: Number.parseFloat(price) }))
    .filter((entry) => Number.isFinite(entry.amount))
    .sort((a, b) => a.amount - b.amount);
  if (priced.length === 0) return { min: null, max: null };
  return {
    min: priced[0].price,
    max: priced[priced.length - 1].price,
  };
}
