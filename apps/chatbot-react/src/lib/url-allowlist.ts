/**
 * Link allowlist for assistant markdown.
 * Blocks dangerous schemes and Shopify CDN; allows storefront + common carriers.
 */

const CARRIER_HOST_HINTS = [
  "tracking",
  "dhl.",
  "ups.",
  "fedex.",
  "dpd.",
  "gls.",
  "post.",
  "parcelsapp.",
  "aftership.",
  "17track.",
  "royalmail.",
  "hermes.",
  "evri.",
];

export function getStorefrontHost(): string | null {
  const fromProcess =
    typeof process !== "undefined" ? process.env.VITE_STOREFRONT_HOST : undefined;
  const host = (fromProcess || import.meta.env.VITE_STOREFRONT_HOST || "")
    .trim()
    .toLowerCase();
  if (!host) return null;
  return host.replace(/^https?:\/\//, "").split("/")[0] || null;
}

export function isAllowedChatHref(href: string | undefined): boolean {
  if (!href || !/^https?:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    if (hostname.includes("cdn.shopify.com")) return false;

    const storefront = getStorefrontHost();
    if (
      storefront &&
      (hostname === storefront || hostname.endsWith(`.${storefront}`))
    ) {
      return true;
    }
    if (hostname.endsWith(".myshopify.com")) return true;
    if (CARRIER_HOST_HINTS.some((h) => hostname.includes(h))) return true;

    return !storefront;
  } catch {
    return false;
  }
}
