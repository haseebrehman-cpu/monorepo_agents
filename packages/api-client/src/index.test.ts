import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRdxApiClient } from "./index";

const chatResponse = {
  conversation_id: "conv_01",
  turn_id: "turn_01",
  answer: "Live assistant reply",
  escalated: false,
  degraded: false,
  citations: [],
  products: [],
};

describe("createRdxApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts chat messages to /v1/chat", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () => JSON.stringify(chatResponse),
    });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await api.chat.send({
      message: "Hello",
      tenant: "rdx",
      marketplace: "uk",
    });

    expect(result.answer).toBe("Live assistant reply");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
          tenant: "rdx",
          marketplace: "uk",
        }),
      }),
    );
  });

  it("reads FastAPI nested error messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          error: { code: "unauthorized", message: "Please sign in and try again." },
        }),
    });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com/",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(api.chat.send({ message: "Hello" })).rejects.toMatchObject({
      name: "ApiError",
      message: "Please sign in and try again.",
      status: 401,
      code: "unauthorized",
    } satisfies Partial<ApiError>);
  });

  it("loads healthz and resume-turn endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: async () => JSON.stringify({ status: "ok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            turn_id: "turn_01",
            status: "complete",
            answer: "Done",
            escalated: false,
            degraded: false,
            last_sequence_delivered: 3,
          }),
      });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(api.health.get()).resolves.toEqual({ status: "ok" });
    await expect(api.chat.getTurn("conv_01", "turn_01")).resolves.toMatchObject({
      answer: "Done",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/healthz",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/v1/conversations/conv_01/turns/turn_01",
      expect.any(Object),
    );
  });

  it("reads and writes the cart with shopper headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            cart_ref: null,
            lines: [],
            empty: true,
            totals_are_estimates: true,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: async () =>
          JSON.stringify({
            action_id: "cact_01M258GXFZSCT8MNPP0YNG2856",
            op: "add_line",
            outcome: "succeeded",
            cart: { cart_ref: "crt_1", lines: [], empty: false },
          }),
      });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(
      api.cart.get({
        tenant: "rdx",
        marketplace: "uk",
        sessionId: "shopper-1",
      }),
    ).resolves.toMatchObject({ empty: true });

    await api.cart.addLine(
      {
        listing_id: "lst_01ABC",
        quantity: 1,
        quoted_unit_amount: 2599,
        quoted_currency: "GBP",
      },
      {
        tenant: "rdx",
        marketplace: "uk",
        sessionId: "shopper-1",
        actionId: "cact_01M258GXFZSCT8MNPP0YNG2856",
      },
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/v1/cart?tenant=rdx&marketplace=uk",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/v1/cart/lines?tenant=rdx&marketplace=uk",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          listing_id: "lst_01ABC",
          quantity: 1,
          quoted_unit_amount: 2599,
          quoted_currency: "GBP",
        }),
      }),
    );
    const writeHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    expect(writeHeaders.get("X-Session-Id")).toBe("shopper-1");
    expect(writeHeaders.get("Idempotency-Key")).toBe(
      "cact_01M258GXFZSCT8MNPP0YNG2856",
    );
  });
});
