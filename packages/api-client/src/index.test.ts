import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createRdxApiClient } from "./index";

describe("createRdxApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts chat messages to /v1/chat", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ reply: "Live assistant reply" }),
    });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await api.chat.send("Hello");

    expect(result.reply).toBe("Live assistant reply");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Hello" }),
      }),
    );
  });

  it("throws ApiError on non-OK responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ error: "Agent unavailable" }),
    });

    const api = createRdxApiClient({
      baseUrl: "https://api.example.com/",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(api.chat.send("Hello")).rejects.toMatchObject({
      name: "ApiError",
      message: "Agent unavailable",
      status: 503,
    } satisfies Partial<ApiError>);
  });
});
