import type { SupportProduct, SupportVariant } from "@rdx/chat-contract";

const VARIANT_ID = /^\d{1,20}$/;

/** Variants the cart will accept: digits only, as sent on the product card. */
export function cartVariants(product: SupportProduct): SupportVariant[] {
  return (product.variants ?? []).filter((variant) => VARIANT_ID.test(variant.variant_id));
}

function optionParts(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Size and colour when they already name the variant. The Shopify title is used
 * when it carries options those fields omit, such as fill and height.
 */
export function variantLabel(variant: SupportVariant): string {
  const title = variant.title?.trim() ?? "";
  const named = [...optionParts(variant.size), ...optionParts(variant.colour)];
  const namedKeys = new Set(named.map((part) => part.toLowerCase()));
  const titleAddsDetail = optionParts(title).some((part) => !namedKeys.has(part.toLowerCase()));
  if (title && (named.length === 0 || titleAddsDetail)) return title;
  if (named.length > 0) return named.join(" / ");
  return "One size";
}

/** The variant a card should add, preferring one that is still for sale. */
export function defaultVariant(product: SupportProduct): SupportVariant | null {
  const variants = cartVariants(product);
  return variants.find((variant) => variant.available !== false) ?? variants[0] ?? null;
}
