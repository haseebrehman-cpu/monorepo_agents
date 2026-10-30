import type {
  SupportConversation,
  SupportErrorBody,
  SupportHealthResponse,
  SupportMessageRequest,
  SupportOrderLookupRequest,
  SupportOrderLookupResponse,
  SupportPageEvent,
  SupportPageEventRequest,
  SupportPageEventsResponse,
  SupportReply,
  SupportStoreCode,
  SupportStreamEvent,
} from "@rdx/chat-contract";
import { withRetry } from "./errors";
import {
  ApiError,
  joinUrl,
  parseApiErrorCode,
  parseApiErrorMessage,
  type ApiClient,
} from "./http";

export const SUPPORT_MESSAGE_MAX_CHARS = 2000;

const STATUS_BY_CODE: Record<string, number> = {
  invalid_request: 422,
  conversation_not_found: 404,
  not_found: 404,
  method_not_allowed: 405,
  conversation_busy: 409,
  conversation_waiting: 409,
  store_mismatch: 409,
  rate_limited: 429,
  upstream_unavailable: 503,
  order_lookup_unavailable: 503,
  internal_error: 500,
};

/** The server's `request_id` for an error, for bug reports. */
export function supportRequestId(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  const body = error.body as Partial<SupportErrorBody> | null | undefined;
  return body?.error?.request_id;
}

function conversationPath(conversationId: string, suffix = ""): string {
  const id = conversationId.trim();
  if (!id) throw new ApiError("conversation_id is required.", 422, null, { code: "invalid_request" });
  return `/v1/conversations/${encodeURIComponent(id)}${suffix}`;
}

function messageBody(request: SupportMessageRequest): string {
  const message = request.message.trim();
  if (!message) {
    throw new ApiError("Message cannot be empty.", 422, null, { code: "invalid_request" });
  }
  if (message.length > SUPPORT_MESSAGE_MAX_CHARS) {
    throw new ApiError(
      `Message is longer than ${SUPPORT_MESSAGE_MAX_CHARS} characters.`,
      422,
      null,
      { code: "invalid_request" },
    );
  }
  return JSON.stringify({
    store: request.store,
    message,
    menu_choice: request.menu_choice ?? null,
  });
}

export function getSupportHealth(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<SupportHealthResponse> {
  return client.request<SupportHealthResponse>("/v1/health", { signal });
}

export function startConversation(
  client: ApiClient,
  store: SupportStoreCode,
  signal?: AbortSignal,
): Promise<SupportConversation> {
  return withRetry(() =>
    client.request<SupportConversation>("/v1/conversations", {
      method: "POST",
      body: JSON.stringify({ store }),
      signal,
    }),
  );
}

/** Never retried automatically: the agents may already have acted on it. */
export async function sendSupportMessage(
  client: ApiClient,
  conversationId: string,
  request: SupportMessageRequest,
  signal?: AbortSignal,
): Promise<SupportReply> {
  return client.request<SupportReply>(conversationPath(conversationId, "/messages"), {
    method: "POST",
    body: messageBody(request),
    signal,
  });
}

export type SupportStreamHandlers = {
  onEvent?: (event: SupportStreamEvent) => void;
  onStep?: (step: { step: string; label: string }) => void;
  signal?: AbortSignal;
};

function parseFrame(frame: string): SupportStreamEvent | null {
  let event = "";
  const data: string[] = [];
  for (const rawLine of frame.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!event || data.length === 0) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) } as SupportStreamEvent;
  } catch {
    return null;
  }
}

async function* readFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<SupportStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      buffer = buffer.replace(/\r\n/g, "\n");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const parsed = parseFrame(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (parsed) yield parsed;
      }
      if (done) break;
    }
    const trailing = parseFrame(buffer);
    if (trailing) yield trailing;
  } finally {
    reader.releaseLock();
  }
}

async function readErrorPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function retryAfterOf(response: Response): number | undefined {
  const seconds = Number.parseFloat(response.headers.get("Retry-After") ?? "");
  return Number.isFinite(seconds) ? seconds : undefined;
}

/**
 * Sends a message on the SSE endpoint and resolves with the reply object.
 * Errors before the stream starts reject with the HTTP status; errors after it
 * started reject with the status implied by `error.code`.
 */
export async function streamSupportMessage(
  client: ApiClient,
  conversationId: string,
  request: SupportMessageRequest,
  handlers: SupportStreamHandlers = {},
): Promise<SupportReply> {
  const headers = new Headers(client.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "text/event-stream");

  const response = await client.fetch(
    joinUrl(client.baseUrl, conversationPath(conversationId, "/messages/stream")),
    { method: "POST", headers, body: messageBody(request), signal: handlers.signal },
  );

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new ApiError(parseApiErrorMessage(payload, response.status), response.status, payload, {
      code: parseApiErrorCode(payload),
      retryAfter: retryAfterOf(response),
    });
  }
  if (!response.body) {
    throw new ApiError("The stream response had no body.", 502);
  }

  for await (const event of readFrames(response.body)) {
    handlers.onEvent?.(event);
    if (event.event === "step") handlers.onStep?.(event.data);
    if (event.event === "reply") return event.data.reply;
    if (event.event === "error") {
      const code = event.data.error?.code;
      throw new ApiError(
        parseApiErrorMessage(event.data, 500),
        STATUS_BY_CODE[code] ?? 500,
        event.data,
        { code },
      );
    }
  }

  throw new ApiError("The stream ended without a reply.", 502, null, { code: "internal_error" });
}

export async function sendPageEvent(
  client: ApiClient,
  conversationId: string,
  event: SupportPageEventRequest,
  signal?: AbortSignal,
): Promise<SupportPageEvent> {
  if (!/^[a-z][a-z0-9_]*$/.test(event.type)) {
    throw new ApiError("Event type must be lower case with underscores.", 422, null, {
      code: "invalid_request",
    });
  }
  return client.request<SupportPageEvent>(conversationPath(conversationId, "/events"), {
    method: "POST",
    body: JSON.stringify({ summary: null, ...event }),
    signal,
  });
}

export function listPageEvents(
  client: ApiClient,
  conversationId: string,
  store: SupportStoreCode,
  signal?: AbortSignal,
): Promise<SupportPageEventsResponse> {
  const query = new URLSearchParams({ store }).toString();
  return withRetry(() =>
    client.request<SupportPageEventsResponse>(conversationPath(conversationId, `/events?${query}`), {
      signal,
    }),
  );
}

export async function lookupOrder(
  client: ApiClient,
  request: SupportOrderLookupRequest,
  signal?: AbortSignal,
): Promise<SupportOrderLookupResponse> {
  const orderNumber = request.order_number.trim();
  const email = request.email?.trim() || null;
  const postcode = request.postcode?.trim() || null;
  if (!orderNumber || (!email && !postcode)) {
    throw new ApiError("An order number and an email or postcode are required.", 422, null, {
      code: "invalid_request",
    });
  }
  return client.request<SupportOrderLookupResponse>("/v1/orders/lookup", {
    method: "POST",
    body: JSON.stringify({
      store: request.store,
      order_number: orderNumber,
      email,
      postcode,
      conversation_id: request.conversation_id ?? null,
    }),
    signal,
  });
}

export type SupportApi = {
  health: (signal?: AbortSignal) => Promise<SupportHealthResponse>;
  startConversation: (store: SupportStoreCode, signal?: AbortSignal) => Promise<SupportConversation>;
  sendMessage: (
    conversationId: string,
    request: SupportMessageRequest,
    signal?: AbortSignal,
  ) => Promise<SupportReply>;
  streamMessage: (
    conversationId: string,
    request: SupportMessageRequest,
    handlers?: SupportStreamHandlers,
  ) => Promise<SupportReply>;
  sendEvent: (
    conversationId: string,
    event: SupportPageEventRequest,
    signal?: AbortSignal,
  ) => Promise<SupportPageEvent>;
  listEvents: (
    conversationId: string,
    store: SupportStoreCode,
    signal?: AbortSignal,
  ) => Promise<SupportPageEventsResponse>;
  lookupOrder: (
    request: SupportOrderLookupRequest,
    signal?: AbortSignal,
  ) => Promise<SupportOrderLookupResponse>;
};

export function createSupportApi(client: ApiClient): SupportApi {
  return {
    health: (signal) => getSupportHealth(client, signal),
    startConversation: (store, signal) => startConversation(client, store, signal),
    sendMessage: (id, request, signal) => sendSupportMessage(client, id, request, signal),
    streamMessage: (id, request, handlers) => streamSupportMessage(client, id, request, handlers),
    sendEvent: (id, event, signal) => sendPageEvent(client, id, event, signal),
    listEvents: (id, store, signal) => listPageEvents(client, id, store, signal),
    lookupOrder: (request, signal) => lookupOrder(client, request, signal),
  };
}
