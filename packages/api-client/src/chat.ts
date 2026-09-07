import type {
  ChatRequestBody,
  ChatSuccessResponse,
  ResumeTurnResponse,
} from "@rdx/chat-contract";
import { ApiError, type ApiClient } from "./http";
import { throwIfErrorPayload, withRetry } from "./errors";

export async function sendChatMessage(
  client: ApiClient,
  request: ChatRequestBody,
): Promise<ChatSuccessResponse> {
  const trimmed = request.message.trim();
  if (!trimmed) {
    throw new ApiError("Message cannot be empty.", 400);
  }

  const body: ChatRequestBody = {
    ...request,
    message: trimmed,
  };

  const payload = await withRetry(() =>
    client.request<ChatSuccessResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

  throwIfErrorPayload(payload);

  if (typeof payload.answer !== "string" || !payload.answer.trim()) {
    throw new ApiError("The assistant returned an empty reply.", 502, payload);
  }

  return payload;
}

export async function getTurn(
  client: ApiClient,
  conversationId: string,
  turnId: string,
): Promise<ResumeTurnResponse> {
  if (!conversationId.trim() || !turnId.trim()) {
    throw new ApiError("conversation_id and turn_id are required.", 400);
  }

  const payload = await client.request<ResumeTurnResponse>(
    `/v1/conversations/${encodeURIComponent(conversationId)}/turns/${encodeURIComponent(turnId)}`,
  );
  throwIfErrorPayload(payload);
  return payload;
}

export type ChatApi = {
  send: (request: ChatRequestBody) => Promise<ChatSuccessResponse>;
  getTurn: (
    conversationId: string,
    turnId: string,
  ) => Promise<ResumeTurnResponse>;
};

export function createChatApi(client: ApiClient): ChatApi {
  return {
    send: (request) => sendChatMessage(client, request),
    getTurn: (conversationId, turnId) =>
      getTurn(client, conversationId, turnId),
  };
}
