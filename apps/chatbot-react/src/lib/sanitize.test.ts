import { describe, expect, it } from "vitest";
import { sanitizeReply, stripAssistantMedia } from "./sanitize";

describe("stripAssistantMedia", () => {
  it("strips markdown images", () => {
    expect(
      stripAssistantMedia("Hello ![chart](https://evil.example/x.png) there"),
    ).toBe("Hello  there");
  });

  it("strips Shopify CDN URLs", () => {
    expect(
      stripAssistantMedia(
        "See https://cdn.shopify.com/s/files/1/product.jpg for the photo",
      ),
    ).toBe("See  for the photo");
  });

  it("redacts leaked secrets", () => {
    expect(
      stripAssistantMedia(
        "key=sk-abcdefghijklmnopqrstuvwxyz OPENAI_API_KEY REDIS_URL",
      ),
    ).toBe("key=[redacted] [redacted] [redacted]");
  });

  it("normalizes bullets and extra blank lines", () => {
    expect(stripAssistantMedia("• one\n\n\n\n● two")).toBe("-  one\n\n-  two");
  });
});

describe("sanitizeReply", () => {
  it("is an alias of stripAssistantMedia", () => {
    expect(sanitizeReply).toBe(stripAssistantMedia);
  });
});
