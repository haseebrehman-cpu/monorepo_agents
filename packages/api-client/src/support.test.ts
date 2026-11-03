import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRdxApiClient, supportRequestId } from "./index";

const reply = {
  type: "message",
  text: "Try the RDX S5 gloves.",
  conversation_id: "a1b2c3d4e5f6",
  products: [],
  sources: [],
  handoff: null,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => JSON.stringify(body),
  };
}

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return { ok: true, status: 200, headers: new Headers(), body };
}

function client(fetchMock: ReturnType<typeof vi.fn>) {
  return createRdxApiClient({
    baseUrl: "https://api.example.com",
    fetch: fetchMock as unknown as typeof fetch,
  });
}

describe("support api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts a conversation for a store", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ conversation_id: "a1b2c3d4e5f6", store: "uk" }, 201));

    const result = await client(fetchMock).support.startConversation("uk");

    expect(result.conversation_id).toBe("a1b2c3d4e5f6");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/conversations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ store: "uk" }) }),
    );
  });

  it("sends a trimmed message with menu_choice defaulting to null", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(reply));

    await client(fetchMock).support.sendMessage("a1b2c3d4e5f6", {
      store: "uk",
      message: "  Hello  ",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/conversations/a1b2c3d4e5f6/messages",
      expect.objectContaining({
        body: JSON.stringify({ store: "uk", message: "Hello", menu_choice: null }),
      }),
    );
  });

  it("rejects messages over the length limit without calling the API", async () => {
    const fetchMock = vi.fn();

    await expect(
      client(fetchMock).support.sendMessage("a1b2c3d4e5f6", {
        store: "uk",
        message: "x".repeat(2001),
      }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads step events and resolves with the streamed reply, across chunk boundaries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        'id: 1\nevent: start\ndata: {"conversation_id": "a1b2c3d4e5f6", "store": "uk"}\n\n',
        'id: 2\nevent: step\ndata: {"step": "product", "label": "Searching',
        ' products"}\n\nid: 3\nevent: reply\n',
        `data: ${JSON.stringify({ reply })}\n\n`,
      ]),
    );
    const onStep = vi.fn();

    const result = await client(fetchMock).support.streamMessage(
      "a1b2c3d4e5f6",
      { store: "uk", message: "gloves" },
      { onStep },
    );

    expect(onStep).toHaveBeenCalledWith({ step: "product", label: "Searching products" });
    expect(result.text).toBe(reply.text);
  });

  it("maps a stream error event to an ApiError with its code and request id", async () => {
    const error = { error: { code: "upstream_unavailable", message: "LLM down", request_id: "req_1" } };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(sseResponse([`event: error\ndata: ${JSON.stringify(error)}\n\n`]));

    const caught = await client(fetchMock)
      .support.streamMessage("a1b2c3d4e5f6", { store: "uk", message: "hi" })
      .catch((e: unknown) => e);

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught).toMatchObject({ status: 503, code: "upstream_unavailable" });
    expect(supportRequestId(caught)).toBe("req_1");
  });

  it("surfaces pre-stream errors with status, code and Retry-After", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "conversation_busy", message: "busy" } }, 409, {
        "Retry-After": "3",
      }),
    );

    await expect(
      client(fetchMock).support.streamMessage("a1b2c3d4e5f6", { store: "uk", message: "hi" }),
    ).rejects.toMatchObject({ status: 409, code: "conversation_busy", retryAfter: 3 });
  });

  it("requires an email or postcode for order lookups", async () => {
    const fetchMock = vi.fn();

    await expect(
      client(fetchMock).support.lookupOrder({ store: "uk", order_number: "RDX10001" }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads the conversation cart for its store", async () => {
    const cart = {
      cart_id: null,
      currency: "GBP",
      items: [],
      item_count: 0,
      subtotal: 0,
      total: 0,
      checkout_url: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(cart));

    await expect(client(fetchMock).support.getCart("a1b2c3d4e5f6", "uk")).resolves.toEqual(cart);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/conversations/a1b2c3d4e5f6/cart?store=uk",
      expect.anything(),
    );
  });

  it("adds a variant and returns the cart, including its checkout link", async () => {
    const cart = {
      currency: "GBP",
      items: [{ variant_id: "47346215551286", quantity: 1, price: 12.99, total: 12.99 }],
      item_count: 1,
      subtotal: 12.99,
      total: 12.99,
      checkout_url: "https://rdx-sports-store.myshopify.com/cart/c/abc?key=secret",
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(cart));

    const result = await client(fetchMock).support.addCartItem("a1b2c3d4e5f6", {
      store: "uk",
      variant_id: " 47346215551286 ",
    });

    expect(result.checkout_url).toBe(cart.checkout_url);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/conversations/a1b2c3d4e5f6/cart/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ store: "uk", variant_id: "47346215551286", quantity: 1 }),
      }),
    );
  });

  it("sets a cart quantity, where 0 removes the item", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ currency: "GBP", items: [], item_count: 0, subtotal: 0, total: 0 }),
    );

    await client(fetchMock).support.updateCartItem("a1b2c3d4e5f6", "47346215551286", {
      store: "eu",
      quantity: 0,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/conversations/a1b2c3d4e5f6/cart/items/47346215551286",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ store: "eu", quantity: 0 }),
      }),
    );
  });

  it("rejects a variant id that is not digits before calling the cart", async () => {
    const fetchMock = vi.fn();

    await expect(
      client(fetchMock).support.addCartItem("a1b2c3d4e5f6", {
        store: "uk",
        variant_id: "gid://shopify/ProductVariant/1",
      }),
    ).rejects.toMatchObject({ code: "invalid_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates page event types", async () => {
    const fetchMock = vi.fn();

    await expect(
      client(fetchMock).support.sendEvent("a1b2c3d4e5f6", {
        store: "uk",
        type: "CartAdd",
        data: {},
      }),
    ).rejects.toMatchObject({ code: "invalid_request" });
  });
});
