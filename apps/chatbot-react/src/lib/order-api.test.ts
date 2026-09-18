import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOrderVerifyBody,
  defaultOrderChallenge,
  looksLikeOrderTracking,
  resolveOrderVerification,
  shouldOfferOrderVerification,
} from "./order-api";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  };
}

const challenge = defaultOrderChallenge("1001");

describe("order verification helpers", () => {
  it("detects track-your-order button and tracking phrases", () => {
    expect(looksLikeOrderTracking("Track Your Order")).toBe(true);
    expect(looksLikeOrderTracking("I want to track my order")).toBe(true);
    expect(looksLikeOrderTracking("where is my order")).toBe(true);
    expect(looksLikeOrderTracking("What size are the gloves?")).toBe(false);
  });

  it("offers a local form for tracking intent or an order skill asking for details", () => {
    expect(
      shouldOfferOrderVerification(
        { skill: "commerce", answer: "The gloves are £14.99" },
        "Track Your Order",
      ),
    ).toBe(true);
    expect(
      shouldOfferOrderVerification(
        {
          skill: "order",
          answer:
            "To track your order, I need to verify your details first. Could you please provide your order number and the email address associated with the order?",
        },
        "can you help with shipping",
      ),
    ).toBe(true);
    expect(
      shouldOfferOrderVerification(
        { skill: "order", answer: "Your order is on the way." },
        "is it shipped yet?",
      ),
    ).toBe(false);
    expect(
      resolveOrderVerification(
        {
          skill: "order",
          answer:
            "To track your order, I need to verify your details first. Could you please provide your order number and the email address associated with the order?",
        },
        "Track Your Order",
      )?.fields.map((field) => field.name),
    ).toEqual(["order_number", "email"]);
  });

  it("sends only the fields the descriptor asked for", () => {
    expect(
      buildOrderVerifyBody(challenge.fields, {
        order_number: "1001",
        email: "buyer@example.com",
        extra: "nope",
      }),
    ).toEqual({
      order_number: "1001",
      email: "buyer@example.com",
    });
  });

  it("does not strip a hash from the order number", () => {
    expect(
      buildOrderVerifyBody(challenge.fields, {
        order_number: "  #1001  ",
        email: "buyer@example.com",
      }).order_number,
    ).toBe("  #1001  ");
  });
});

describe("order API", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("posts verification with only requested fields", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        verified: true,
        locked: false,
        order_reference: "1001",
        order: { order_number: "1001", status: "PAID" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { verifyOrder } = await import("./order-api");
    const result = await verifyOrder({
      region: "uk",
      body: { order_number: "1001", email: "buyer@example.com" },
    });

    expect(result.verified).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/orders/verify?tenant=rdx&marketplace=uk",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          order_number: "1001",
          email: "buyer@example.com",
        }),
      }),
    );
  });
});
