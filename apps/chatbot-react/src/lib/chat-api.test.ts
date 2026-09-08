import { afterEach, describe, expect, it, vi } from "vitest";

function mockChatResponse() {
  return {
    ok: true,
    headers: new Headers(),
    text: async () =>
      JSON.stringify({
        conversation_id: "conv_01",
        turn_id: "turn_01",
        answer: "Live assistant reply",
      }),
  };
}

describe("sendChatMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("posts to the configured chat API base URL with staging scope", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    vi.stubEnv("VITE_TENANT", "rdx");
    const fetchMock = vi.fn().mockResolvedValue(mockChatResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    const result = await sendChatMessage({
      message: "Hello",
      client_message_id: "msg-1",
      region: "uk",
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

  it("uses the selected region as marketplace instead of VITE_MARKETPLACE", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://api.example.com");
    vi.stubEnv("VITE_TENANT", "rdx");
    vi.stubEnv("VITE_MARKETPLACE", "uk");
    const fetchMock = vi.fn().mockResolvedValue(mockChatResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    await sendChatMessage({
      message: "Hello",
      region: "usa",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat",
      expect.objectContaining({
        body: JSON.stringify({
          message: "Hello",
          tenant: "rdx",
          marketplace: "usa",
        }),
      }),
    );
  });

  it("uses the backend URL on a production host instead of a same-origin proxy", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://backend-staging-1a2f.up.railway.app");
    vi.stubGlobal("window", {
      location: { hostname: "chatbot-react.vercel.app" },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockChatResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    await sendChatMessage({ message: "Hello" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend-staging-1a2f.up.railway.app/v1/chat",
      expect.anything(),
    );
  });

  it("keeps the Vite proxy on localhost", async () => {
    vi.stubEnv("VITE_CHAT_API_URL", "https://backend-staging-1a2f.up.railway.app");
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    const fetchMock = vi.fn().mockResolvedValue(mockChatResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { sendChatMessage } = await import("./chat-api");
    await sendChatMessage({ message: "Hello" });

    expect(fetchMock).toHaveBeenCalledWith("/rdx-api/v1/chat", expect.anything());
  });
});
