import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendChatMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("posts to the configured chat API base URL with staging scope", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    vi.stubEnv("VITE_TENANT", "rdx");
    vi.stubEnv("VITE_MARKETPLACE", "uk");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: async () =>
        JSON.stringify({
          conversation_id: "conv_01",
          turn_id: "turn_01",
          answer: "Live assistant reply",
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    const result = await sendChatMessage({
      message: "Hello",
      client_message_id: "msg-1",
    });

    expect(result.answer).toBe("Live assistant reply");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Hello",
          client_message_id: "msg-1",
          tenant: "rdx",
          marketplace: "uk",
        }),
      }),
    );
  });
});
