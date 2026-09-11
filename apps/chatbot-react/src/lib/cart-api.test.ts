import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toMinorUnits, isValidSessionId } from "./cart-api";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  };
}

const emptyCart = {
  cart_ref: null,
  lines: [],
  empty: true,
  totals_are_estimates: true,
};

const addSucceeded = {
  action_id: "cact_01M258GXFZSCT8MNPP0YNG2856",
  op: "add_line",
  outcome: "succeeded",
  reason: "",
  cart: {
    cart_ref: "crt_01",
    lines: [],
    empty: false,
    totals_are_estimates: true,
  },
  replayed: false,
  retryable: false,
};

describe("cart helpers", () => {
  it("converts decimal card prices to minor units", () => {
    expect(toMinorUnits("25.99")).toBe(2599);
    expect(toMinorUnits("14.99")).toBe(1499);
    expect(toMinorUnits("0.10")).toBe(10);
    expect(toMinorUnits(null)).toBeUndefined();
    expect(toMinorUnits("n/a")).toBeUndefined();
  });

  it("rejects empty, anon, and swagger placeholder session ids", () => {
    expect(isValidSessionId("anon")).toBe(false);
    expect(isValidSessionId("string")).toBe(false);
    expect(isValidSessionId("")).toBe(false);
    expect(isValidSessionId("  ")).toBe(false);
    expect(isValidSessionId("6911ecb1-4c09-45d6-b9a8-9e4293706f32")).toBe(true);
  });
});

describe("cart API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("reads the basket with staging shopper headers", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    vi.stubEnv("VITE_TENANT", "rdx");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(emptyCart));
    vi.stubGlobal("fetch", fetchMock);

    const { getCart, getShopperSessionId } = await import("./cart-api");
    const sessionId = getShopperSessionId();
    await getCart("uk");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/cart?tenant=rdx&marketplace=uk",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("X-Session-Id")).toBe(sessionId);
    expect(headers.get("Idempotency-Key")).toBeNull();
  });

  it("posts a line with a cact_ key and minor-unit quote", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(addSucceeded));
    vi.stubGlobal("fetch", fetchMock);

    const { addCartLine } = await import("./cart-api");
    await addCartLine({
      region: "uk",
      listingId: "lst_01M0XKXPX30ESHCM5QBN0K2TBS",
      quantity: 1,
      quotedUnitAmount: 2599,
      quotedCurrency: "GBP",
      actionId: "cact_01M258GXFZSCT8MNPP0YNG2856",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/cart/lines?tenant=rdx&marketplace=uk",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          listing_id: "lst_01M0XKXPX30ESHCM5QBN0K2TBS",
          quantity: 1,
          quoted_unit_amount: 2599,
          quoted_currency: "GBP",
        }),
      }),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Idempotency-Key")).toBe(
      "cact_01M258GXFZSCT8MNPP0YNG2856",
    );
    expect(headers.get("X-Session-Id")).toBeTruthy();
  });

  it("omits tenant query and X-Session-Id when a widget token is present", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    vi.stubEnv("VITE_SESSION_TOKEN", "widget-token");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(emptyCart));
    vi.stubGlobal("fetch", fetchMock);

    const { getCart } = await import("./cart-api");
    await getCart("uk");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/cart",
      expect.anything(),
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("X-Session-Token")).toBe("widget-token");
    expect(headers.get("X-Session-Id")).toBeNull();
  });

  it("retries a busy write once with the same key", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          ...addSucceeded,
          outcome: "busy",
          retryable: true,
        }),
      )
      .mockResolvedValueOnce(jsonResponse(addSucceeded));
    vi.stubGlobal("fetch", fetchMock);

    const { addCartLine } = await import("./cart-api");
    const result = await addCartLine({
      region: "uk",
      listingId: "lst_01ABC",
      quantity: 1,
      actionId: "cact_01M258GXFZSCT8MNPP0YNG2856",
    });

    expect(result.outcome).toBe("succeeded");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    const second = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(first.get("Idempotency-Key")).toBe(
      "cact_01M258GXFZSCT8MNPP0YNG2856",
    );
    expect(second.get("Idempotency-Key")).toBe(
      "cact_01M258GXFZSCT8MNPP0YNG2856",
    );
  });

  it("replays a lost write instead of minting a new key", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(
        jsonResponse({ ...addSucceeded, replayed: true }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const { addCartLine } = await import("./cart-api");
    const result = await addCartLine({
      region: "uk",
      listingId: "lst_01ABC",
      quantity: 1,
      actionId: "cact_01M258GXFZSCT8MNPP0YNG2856",
    });

    expect(result.replayed).toBe(true);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.example.com/v1/cart/actions/cact_01M258GXFZSCT8MNPP0YNG2856?tenant=rdx&marketplace=uk",
    );
  });

  it("does not auto-retry an unknown basket change", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        ...addSucceeded,
        outcome: "unknown",
        retryable: false,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { addCartLine } = await import("./cart-api");
    const result = await addCartLine({
      region: "uk",
      listingId: "lst_01ABC",
      quantity: 1,
      actionId: "cact_01M258GXFZSCT8MNPP0YNG2856",
    });

    expect(result.outcome).toBe("unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mints cact_ ULID action ids", async () => {
    const { newCartActionId, isCartActionId } = await import("./cart-api");
    const id = newCartActionId();
    expect(id).toMatch(/^cact_[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
    expect(isCartActionId(id)).toBe(true);
    expect(isCartActionId("cact_81M258GXFZSCT8MNPP0YNG2856")).toBe(false);
  });
});
