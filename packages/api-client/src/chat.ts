import type {
  ChatErrorResponse,
  ChatRequestBody,
  ChatSuccessResponse,
} from "@rdx/chat-contract";
import { ApiError, type ApiClient } from "./http";

function isErrorResponse(value: unknown): value is ChatErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ChatErrorResponse).error === "string"
  );
}

/** POST /v1/chat — shared by chatbot, dashboard, and future clients. */
export async function sendChatMessage(
  client: ApiClient,
  message: string,
): Promise<ChatSuccessResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new ApiError("Message cannot be empty.", 400);
  }

  const body: ChatRequestBody = { message: trimmed };
  const payload = await client.request<ChatSuccessResponse | ChatErrorResponse>(
    "/v1/chat",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  if (isErrorResponse(payload)) {
    throw new ApiError(payload.error, 400, payload);
  }

  if (typeof payload.reply !== "string" || !payload.reply.trim()) {
    throw new ApiError("The assistant returned an empty reply.", 502, payload);
  }

  return payload;
}

export type ChatApi = {
  send: (message: string) => Promise<ChatSuccessResponse>;
};

export function createChatApi(client: ApiClient): ChatApi {
  return {
    send: (message) => sendChatMessage(client, message),
  };
}
