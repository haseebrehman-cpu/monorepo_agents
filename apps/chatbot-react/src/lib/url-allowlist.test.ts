import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getStorefrontHost,
  isAllowedChatHref,
  isAllowedImageUrl,
} from "./url-allowlist";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getStorefrontHost", () => {
  it("returns null when the env var is unset", () => {
    vi.stubEnv("VITE_STOREFRONT_HOST", "");
    expect(getStorefrontHost()).toBeNull();
  });

  it("strips protocol and path", () => {
    vi.stubEnv("VITE_STOREFRONT_HOST", "https://Shop.Example.com/store");
    expect(getStorefrontHost()).toBe("shop.example.com");
  });
});

describe("isAllowedChatHref", () => {
  it("rejects missing, relative, and non-http schemes", () => {
    expect(isAllowedChatHref(undefined)).toBe(false);
    expect(isAllowedChatHref("/products/x")).toBe(false);
    expect(isAllowedChatHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedChatHref("mailto:a@b.com")).toBe(false);
  });

  it("rejects Shopify CDN hosts", () => {
    expect(isAllowedChatHref("https://cdn.shopify.com/s/files/x.png")).toBe(
      false,
    );
  });

  it("allows myshopify and carrier hosts even when a storefront is configured", () => {
    vi.stubEnv("VITE_STOREFRONT_HOST", "shop.example.com");
    expect(isAllowedChatHref("https://store.myshopify.com/products/x")).toBe(
      true,
    );
    expect(isAllowedChatHref("https://www.dhl.com/track")).toBe(true);
  });

  it("allows the configured storefront and its subdomains", () => {
    vi.stubEnv("VITE_STOREFRONT_HOST", "shop.example.com");
    expect(isAllowedChatHref("https://shop.example.com/products/x")).toBe(true);
    expect(isAllowedChatHref("https://cdn.shop.example.com/asset")).toBe(true);
  });

  it("rejects unknown hosts when a storefront is configured", () => {
    vi.stubEnv("VITE_STOREFRONT_HOST", "shop.example.com");
    expect(isAllowedChatHref("https://evil.example/phish")).toBe(false);
  });

  it("allows RDX storefronts and rejects unknown hosts", () => {
    expect(isAllowedChatHref("https://rdxsports.co.uk/products/x")).toBe(true);
    expect(isAllowedChatHref("https://evil.example/phish")).toBe(false);
  });
});

describe("isAllowedImageUrl", () => {
  it("allows Shopify CDN and storefront https images", () => {
    expect(
      isAllowedImageUrl("https://cdn.shopify.com/s/files/1/example.jpg"),
    ).toBe(true);
    expect(
      isAllowedImageUrl("https://rdxsports.co.uk/cdn/shop/files/x.jpg"),
    ).toBe(true);
  });

  it("rejects non-https and unknown hosts", () => {
    expect(isAllowedImageUrl("http://cdn.shopify.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://evil.example/x.jpg")).toBe(false);
  });
});
