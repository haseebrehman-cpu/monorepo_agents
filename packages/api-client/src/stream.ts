import type {
  ChatRequestBody,
  ChatStreamEvent,
  ChatSuccessResponse,
  StreamEventType,
} from "@rdx/chat-contract";
import { ApiError, joinUrl, parseApiErrorMessage, type ApiClient } from "./http";
import { throwIfErrorPayload } from "./errors";

export type StreamChatHandlers = {
  onEvent?: (event: ChatStreamEvent) => void;
};

function applyDefaultHeaders(
  headers: Headers,
  defaults: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(defaults)) {
    if (!headers.has(key)) headers.set(key, value);
  }
}

function parseSseBlock(block: string): ChatStreamEvent | null {
  let event: StreamEventType | "" = "";
  const dataLines: string[] = [];

  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() as StreamEventType;
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!event || dataLines.length === 0) return null;

  try {
    const data = JSON.parse(dataLines.join("\n")) as ChatStreamEvent["data"];
    return { event, data } as ChatStreamEvent;
  } catch {
    return null;
  }
}

async function* iterateSse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<ChatStreamEvent> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseBlock(block);
      if (parsed) yield parsed;
    }

    if (done) break;
  }

  const trailing = parseSseBlock(buffer);
  if (trailing) yield trailing;
}

export async function streamChatMessage(
  client: ApiClient,
  request: ChatRequestBody,
  handlers: StreamChatHandlers = {},
): Promise<ChatSuccessResponse> {
  const trimmed = request.message.trim();
  if (!trimmed) {
    throw new ApiError("Message cannot be empty.", 400);
  }

  const headers = new Headers();
  applyDefaultHeaders(headers, client.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "text/event-stream");

  const response = await client.fetch(joinUrl(client.baseUrl, "/v1/chat/stream"), {
    method: "POST",
    headers,
    body: JSON.stringify({ ...request, message: trimmed }),
  });

  if (!response.ok) {
    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = text;
      }
    }
    throw new ApiError(parseApiErrorMessage(payload, response.status), response.status, payload);
  }

  if (!response.body) {
    throw new ApiError("The stream response had no body.", 502);
  }

  let conversationId = "";
  let turnId = "";
  let answer = "";
  let skill: string | null = null;
  const result: ChatSuccessResponse = {
    conversation_id: "",
    turn_id: "",
    answer: "",
  };

  for await (const event of iterateSse(response.body.getReader())) {
    handlers.onEvent?.(event);

    switch (event.event) {
      case "meta":
        conversationId = event.data.conversation_id;
        turnId = event.data.turn_id;
        skill = event.data.skill ?? null;
        break;
      case "delta":
        answer += event.data.text;
        break;
      case "replace":
        answer = event.data.text;
        break;
      case "done":
        result.escalated = event.data.escalated;
        result.degraded = event.data.degraded;
        result.citations = event.data.citations;
        result.products = event.data.products;
        result.cost_usd = event.data.cost_usd;
        result.skill = event.data.skill ?? skill;
        break;
      case "error":
        throw new ApiError(event.data.message, 500, event.data);
      default:
        break;
    }
  }

  result.conversation_id = conversationId;
  result.turn_id = turnId;
  result.answer = answer;
  result.skill = result.skill ?? skill;

  throwIfErrorPayload(result);

  if (!result.answer.trim()) {
    throw new ApiError("The assistant returned an empty reply.", 502, result);
  }

  return result;
}

export type StreamApi = {
  send: (
    request: ChatRequestBody,
    handlers?: StreamChatHandlers,
  ) => Promise<ChatSuccessResponse>;
};

export function createStreamApi(client: ApiClient): StreamApi {
  return {
    send: (request, handlers) => streamChatMessage(client, request, handlers),
  };
}
