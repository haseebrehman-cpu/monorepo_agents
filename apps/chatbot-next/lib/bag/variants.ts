import type { SupportProduct, SupportVariant } from "@rdx/chat-contract";

const VARIANT_ID = /^\d{1,20}$/;

/** Variants the cart will accept: digits only, as sent on the product card. */
export function cartVariants(product: SupportProduct): SupportVariant[] {
  return (product.variants ?? []).filter((variant) => VARIANT_ID.test(variant.variant_id));
}

export function variantLabel(variant: SupportVariant): string {
  const parts = [variant.size, variant.colour].filter((part): part is string => Boolean(part));
  if (parts.length > 0) return parts.join(" / ");
  const title = variant.title?.trim();
  return title || "One size";
}

/** The variant a card should add, preferring one that is still for sale. */
export function defaultVariant(product: SupportProduct): SupportVariant | null {
  const variants = cartVariants(product);
  return variants.find((variant) => variant.available !== false) ?? variants[0] ?? null;
}
