import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOrderVerifyBody,
  getOrderVerificationInitialValues,
} from "./order-api";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  };
}

const challenge = {
  message: "Enter the requested details.",
  required: true,
  reason: "verification_required",
  order_reference: "1001",
  factors: ["email"],
  fields: [
    {
      name: "order_number",
      type: "text",
      label: "Order number",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email address",
      required: true,
    },
  ],
  submit: { method: "POST", path: "/v1/orders/verify" },
};

describe("order verification helpers", () => {
  it("prefills values returned by the chat API", () => {
    expect(
      getOrderVerificationInitialValues({
        ...challenge,
        order_reference: "1001",
        values: { email: "buyer@example.com" },
      }),
    ).toEqual({
      order_number: "1001",
      email: "buyer@example.com",
    });
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
