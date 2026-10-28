import { afterEach, describe, expect, it, vi } from "vitest";
import { contentMatchesMimeType } from "./file-signature.js";
import { sanitizeRichText } from "./html.js";
import { createAttemptLimiter } from "./rate-limit.js";

describe("sanitizeRichText", () => {
  it("keeps editor formatting", () => {
    const html =
      '<div style="text-align:center"><b>Bold</b> <font color="#ff0000" size="5">red</font></div><ul><li>item</li></ul>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("removes scripts, event handlers and javascript URLs", () => {
    const html =
      '<img src=x onerror=alert(1)><script>alert(2)</script><a href="javascript:alert(3)">x</a><svg onload=alert(4)></svg><iframe srcdoc="<script>"></iframe>';
    const clean = sanitizeRichText(html);
    expect(clean).not.toMatch(/onerror|onload|<script|javascript:|<iframe|<svg|<img/i);
  });

  it("drops unsafe inline styles", () => {
    expect(sanitizeRichText('<span style="background-image: url(javascript:x)">a</span>')).toBe(
      "<span>a</span>"
    );
  });

  it("forces safe link attributes", () => {
    expect(sanitizeRichText('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">x</a>'
    );
  });
});

describe("contentMatchesMimeType", () => {
  it("accepts matching signatures", () => {
    expect(
      contentMatchesMimeType("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))
    ).toBe(true);
    expect(contentMatchesMimeType("image/jpeg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(contentMatchesMimeType("application/pdf", Buffer.from("%PDF-1.7\n"))).toBe(true);
  });

  it("rejects content that does not match the declared type", () => {
    expect(contentMatchesMimeType("image/png", Buffer.from("<html><script>"))).toBe(false);
    expect(contentMatchesMimeType("application/pdf", Buffer.from("MZ\x90\x00"))).toBe(false);
    expect(contentMatchesMimeType("text/html", Buffer.from("<html>"))).toBe(false);
  });
});

describe("createAttemptLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks after the maximum failures and unblocks when the window passes", () => {
    vi.useFakeTimers();
    const limiter = createAttemptLimiter({ windowMs: 1000, maxAttempts: 2 });
    limiter.recordFailure("a");
    expect(limiter.retryAfterSeconds("a")).toBe(0);
    limiter.recordFailure("a");
    expect(limiter.retryAfterSeconds("a")).toBeGreaterThan(0);
    vi.advanceTimersByTime(1001);
    expect(limiter.retryAfterSeconds("a")).toBe(0);
  });

  it("resets on success and bounds the number of tracked keys", () => {
    const limiter = createAttemptLimiter({ windowMs: 60_000, maxAttempts: 1, maxKeys: 2 });
    limiter.recordFailure("a");
    limiter.reset("a");
    expect(limiter.retryAfterSeconds("a")).toBe(0);

    limiter.recordFailure("b");
    limiter.recordFailure("c");
    limiter.recordFailure("d");
    expect(limiter.retryAfterSeconds("b")).toBe(0);
    expect(limiter.retryAfterSeconds("d")).toBeGreaterThan(0);
  });
});
