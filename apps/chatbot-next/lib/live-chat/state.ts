import type { LiveChatMessage, LiveChatStatus, LiveChatStatusSnapshot } from "@rdx/chat-contract";

/** Shown at once and replaced by the server copy with the same `clientId`. */
export interface PendingMessage {
  clientId: string;
  body: string;
  at: number;
  failed: boolean;
}

export type LiveChatConnection = "connecting" | "open" | "reconnecting";

export interface LiveChatState {
  /** Server messages, ordered by id. */
  messages: LiveChatMessage[];
  pending: PendingMessage[];
  /** Null until the stream sends the first status. */
  status: LiveChatStatus | null;
  agentName: string | null;
  connection: LiveChatConnection;
  /** The agent has a draft. */
  agentTyping: boolean;
  /** The token expired or the conversation is gone. Nothing more can be sent or received. */
  expired: boolean;
}

export type LiveChatAction =
  | { type: "message"; message: LiveChatMessage }
  | { type: "status"; snapshot: LiveChatStatusSnapshot }
  | { type: "closed" }
  | { type: "connection"; connection: LiveChatConnection }
  | { type: "typing"; typing: boolean }
  | { type: "expired" }
  | { type: "pending"; clientId: string; body: string; at: number }
  | { type: "pending_failed"; clientId: string }
  | { type: "pending_retry"; clientId: string }
  | { type: "reset" };

export const INITIAL_LIVE_CHAT_STATE: LiveChatState = {
  messages: [],
  pending: [],
  status: null,
  agentName: null,
  connection: "connecting",
  agentTyping: false,
  expired: false,
};

/** Message ids are decimal strings of a 64-bit counter. */
export function compareMessageIds(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The customer stays quiet until an agent has accepted and sent the first message. */
export function customerMayReply(state: Pick<LiveChatState, "status" | "messages" | "expired">): boolean {
  if (state.expired || state.status !== "active") return false;
  return state.messages.some((message) => message.author === "agent");
}

function insertMessage(messages: LiveChatMessage[], message: LiveChatMessage): LiveChatMessage[] {
  let index = messages.length;
  while (index > 0) {
    const order = compareMessageIds(messages[index - 1].id, message.id);
    if (order === 0) return messages;
    if (order < 0) break;
    index -= 1;
  }
  return [...messages.slice(0, index), message, ...messages.slice(index)];
}

export function liveChatReducer(state: LiveChatState, action: LiveChatAction): LiveChatState {
  switch (action.type) {
    case "message": {
      const { message } = action;
      const messages = insertMessage(state.messages, message);
      const pending = message.clientId
        ? state.pending.filter((item) => item.clientId !== message.clientId)
        : state.pending;
      if (messages === state.messages && pending === state.pending && !state.agentTyping) return state;
      return {
        ...state,
        messages,
        pending,
        agentTyping: message.author === "agent" ? false : state.agentTyping,
      };
    }
    case "typing":
      return state.agentTyping === action.typing ? state : { ...state, agentTyping: action.typing };
    case "status":
      return { ...state, status: action.snapshot.status, agentName: action.snapshot.agentName };
    case "closed":
      return { ...state, status: "resolved", agentName: null };
    case "connection":
      return state.connection === action.connection ? state : { ...state, connection: action.connection };
    case "expired":
      return { ...state, expired: true };
    case "pending":
      return {
        ...state,
        pending: [...state.pending, { clientId: action.clientId, body: action.body, at: action.at, failed: false }],
      };
    case "pending_failed":
    case "pending_retry": {
      const failed = action.type === "pending_failed";
      return {
        ...state,
        pending: state.pending.map((item) => (item.clientId === action.clientId ? { ...item, failed } : item)),
      };
    }
    case "reset":
      return INITIAL_LIVE_CHAT_STATE;
  }
}
