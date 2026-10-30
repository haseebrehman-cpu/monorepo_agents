import type { SupportInputRequest, SupportReply } from "@rdx/chat-contract";

interface BaseMessage {
  id: string;
  createdAt?: number;
}

export interface UserMessage extends BaseMessage {
  role: "user";
  text: string;
}

export interface WelcomeMessage extends BaseMessage {
  role: "assistant";
  kind: "welcome";
}

export interface ReplyMessage extends BaseMessage {
  role: "assistant";
  kind: "reply";
  reply: SupportReply;
}

export interface ErrorMessage extends BaseMessage {
  role: "assistant";
  kind: "error";
  text: string;
  requestId?: string;
}

export type AssistantMessage = WelcomeMessage | ReplyMessage | ErrorMessage;
export type ChatMessage = UserMessage | AssistantMessage;

export const WELCOME_MESSAGE: WelcomeMessage = { id: "welcome", role: "assistant", kind: "welcome" };
export const INITIAL_TRANSCRIPT: ChatMessage[] = [WELCOME_MESSAGE];

const MAX_MESSAGES = 120;

export type TranscriptAction =
  | { type: "user"; id: string; text: string; at: number }
  | { type: "reply"; id: string; reply: SupportReply; at: number }
  | { type: "error"; id: string; text: string; requestId?: string; at: number }
  | { type: "menu"; id: string; at: number }
  | { type: "reset" };

export function transcriptReducer(state: ChatMessage[], action: TranscriptAction): ChatMessage[] {
  const append = (message: ChatMessage) => [...state, message].slice(-MAX_MESSAGES);
  switch (action.type) {
    case "user":
      return append({ id: action.id, role: "user", text: action.text, createdAt: action.at });
    case "reply":
      return append({
        id: action.id,
        role: "assistant",
        kind: "reply",
        reply: action.reply,
        createdAt: action.at,
      });
    case "error":
      return append({
        id: action.id,
        role: "assistant",
        kind: "error",
        text: action.text,
        requestId: action.requestId,
        createdAt: action.at,
      });
    case "menu":
      return append({ id: action.id, role: "assistant", kind: "welcome", createdAt: action.at });
    case "reset":
      return INITIAL_TRANSCRIPT;
  }
}

function latestAssistant(messages: ChatMessage[]): AssistantMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "assistant") return message;
  }
  return undefined;
}

/** The pending `input_request`, while the conversation is paused for the customer. */
export function pendingInput(messages: ChatMessage[]): SupportInputRequest | null {
  const latest = latestAssistant(messages);
  if (latest?.kind !== "reply" || latest.reply.type !== "input_request") return null;
  return latest.reply.input ?? null;
}

export function latestAssistantId(messages: ChatMessage[]): string | null {
  return latestAssistant(messages)?.id ?? null;
}

export function isHome(messages: ChatMessage[]): boolean {
  return messages.length === 1 && messages[0].role === "assistant" && messages[0].kind === "welcome";
}
