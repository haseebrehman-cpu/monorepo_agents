import type { ChatMessage } from "@rdx/chat-contract";
import { STORE_NAME } from "./constants";

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: createMessageId(),
    role: "assistant",
    content: `Hi! I'm the **${STORE_NAME}** assistant. Looking for gloves, bags, apparel, or the right size? How can I help you today?`,
    showMenu: true,
  };
}
