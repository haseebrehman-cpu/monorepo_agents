import type {
  LiveChatErrorCode,
  LiveChatMessage,
  LiveChatSendMessageRequest,
} from "@rdx/chat-contract";
import { liveChatBase } from "./base";
import { createSseParser, type SseMessage } from "./sse";

/** e.g. `https://cts-api.example.com/api/live-chat/customer`. Live chat stays off without it. */

export class LiveChatApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: LiveChatErrorCode | (string & {}),
  ) {
    super(code);
    this.name = "LiveChatApiError";
  }
}

async function toError(response: Response): Promise<LiveChatApiError> {
  let code = "INTERNAL_SERVER_ERROR";
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") code = body.error;
  } catch {
    // Not JSON, e.g. a proxy error page.
  }
  return new LiveChatApiError(response.status, code);
}

function url(path: string): string {
  const base = liveChatBase();
  if (!base) throw new Error("NEXT_PUBLIC_LIVE_CHAT_API_BASE is not set");
  return `${base}${path}`;
}

/** Asks cts-backend for a customer token for a handoff the assistant already returned. */
export async function claimLiveChatToken(handoffId: string): Promise<string> {
  const response = await fetch(url("/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handoffId }),
  });
  if (!response.ok) throw await toError(response);
  const body = (await response.json()) as { data?: { customerToken?: unknown } };
  const token = body.data?.customerToken;
  if (typeof token !== "string" || token.length === 0) {
    throw new LiveChatApiError(response.status, "INVALID_REQUEST");
  }
  return token;
}

export async function sendLiveChatMessage(
  token: string,
  request: LiveChatSendMessageRequest,
): Promise<LiveChatMessage> {
  const response = await fetch(url("/messages"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await toError(response);
  const body = (await response.json()) as { data: LiveChatMessage };
  return body.data;
}

export async function setLiveChatTyping(token: string, typing: boolean): Promise<void> {
  const response = await fetch(url("/typing"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ typing }),
  });
  if (!response.ok && response.status !== 204) throw await toError(response);
}

/**
 * Reads the event stream until the server ends it or `signal` aborts. Uses
 * fetch rather than EventSource so the token travels in a header, not the URL.
 */
export async function readLiveChatStream(options: {
  token: string;
  lastEventId: string | null;
  signal: AbortSignal;
  onOpen: () => void;
  onMessage: (message: SseMessage) => void;
}): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token}`,
    Accept: "text/event-stream",
  };
  if (options.lastEventId) headers["Last-Event-ID"] = options.lastEventId;

  const response = await fetch(url("/events"), {
    headers,
    signal: options.signal,
    cache: "no-store",
  });
  if (!response.ok || !response.body) throw await toError(response);
  options.onOpen();

  const parser = createSseParser(options.onMessage);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      parser.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}
