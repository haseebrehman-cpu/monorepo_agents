/**
 * Contracts for the live chat customer API (`/api/live-chat/customer/*` on cts-backend).
 * Every request sends `Authorization: Bearer <handoff.customer_token>`.
 */

export type LiveChatStatus = "waiting" | "active" | "resolved";

export interface LiveChatMessage {
  /** Increasing within a conversation. Sent back as `Last-Event-ID` to resume. */
  id: string;
  author: "customer" | "agent" | "system";
  /** The agent's first name for `agent`. */
  authorName: string;
  body: string;
  /** ISO-8601. */
  at: string;
  /** The `clientId` the customer sent, so a pending bubble can be replaced. */
  clientId: string | null;
}

export interface LiveChatStatusSnapshot {
  status: LiveChatStatus;
  /** The agent's first name while the chat is active. */
  agentName: string | null;
}

/** `GET /events` (Server-Sent Events). Opens with a replay, then a `status`, then live changes. */
export type LiveChatStreamEvent =
  | { event: "message"; data: LiveChatMessage }
  | { event: "status"; data: LiveChatStatusSnapshot };

/** `POST /messages`. Responds `201 { success: true, data: LiveChatMessage }`. */
export interface LiveChatSendMessageRequest {
  /** At most 4,000 characters. */
  body: string;
  /** 8 to 64 of `A-Z a-z 0-9 _ -`. Reuse it on retry; the message is stored once. */
  clientId?: string | null;
}

export type LiveChatErrorCode =
  | "NO_TOKEN"
  | "INVALID_TOKEN"
  | "INVALID_REQUEST"
  | "CONVERSATION_NOT_FOUND"
  | "CONVERSATION_CLOSED"
  | "TOO_MANY_STREAMS"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";
