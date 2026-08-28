import type {
  ChatErrorResponse,
  ChatRequestBody,
  ChatSuccessResponse,
} from "@rdx/chat-contract";
import { runDemoAgent } from "../lib/demo-agent.js";

function readLastUserMessage(body: ChatRequestBody): string | null {
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const entry = messages[i];
    if (entry?.role === "user" && entry.content.trim()) {
      return entry.content.trim();
    }
  }

  return null;
}

export async function handleChatRequest(
  body: ChatRequestBody,
  storeName: string,
): Promise<ChatSuccessResponse | ChatErrorResponse> {
  const message = readLastUserMessage(body);
  if (!message) {
    return { error: "Message is required." };
  }

  const result = await runDemoAgent(message, storeName);
  return {
    reply: result.reply,
    attachments: result.attachments,
  };
}
