import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendChatMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("posts to the configured chat API base URL", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ reply: "Live assistant reply" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    const result = await sendChatMessage("Hello");

    expect(result.reply).toBe("Live assistant reply");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "Hello" }),
      }),
    );
  });
});
