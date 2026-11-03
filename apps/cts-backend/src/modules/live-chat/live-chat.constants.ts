export const LIVE_CHAT_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  RESOLVED: "resolved",
} as const;

export type LiveChatStatus = (typeof LIVE_CHAT_STATUS)[keyof typeof LIVE_CHAT_STATUS];

export const DEFAULT_QUEUE_LIMIT = 6;
export const MIN_QUEUE_LIMIT = 1;
export const MAX_QUEUE_LIMIT = 12;

export const DEFAULT_CHANNEL = "Website chat";
export const SYSTEM_AUTHOR_NAME = "System";

/** Serialises queue placement so two handoffs cannot fill the same agent slot. */
export const PLACEMENT_LOCK_KEY = 7_420_019;

export const HANDOFF_LIMITS = {
  conversationId: 64,
  customerName: 120,
  email: 254,
  channel: 60,
  orderNumber: 64,
  handoffReason: 1_000,
  aiSummary: 4_000,
  location: 120,
  tagCount: 10,
} as const;

export const HANDOFF_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 120,
} as const;

export const DESK_RATE_LIMIT = {
  windowMs: 60_000,
  maxRequests: 300,
  maxMutations: 60,
} as const;

/** Closed chats returned in the desk list. Older ones need a search API. */
export const RECENT_RESOLVED_LIMIT = 100;
export const MAX_MESSAGE_BODY = 4_000;

export const EVENTS_CHANNEL = "live_chat_events";
/** Keeps the NOTIFY payload well under Postgres' 8,000-byte limit. */
export const MAX_EVENT_IDS = 100;
export const EVENTS_HEARTBEAT_MS = 25_000;
/** Shorter than the 15-minute session, so each reconnect re-checks the session. */
export const EVENTS_MAX_STREAM_MS = 10 * 60_000;
export const EVENTS_MAX_STREAMS_PER_USER = 5;

export function handoffSystemMessage(reason: string) {
  return `AI handed this chat to a human agent. ${reason}`;
}

export const systemMessages = {
  took: (agent: string) => `${agent} took this conversation.`,
  tookOver: (agent: string, previous: string) =>
    `${agent} took over this conversation from ${previous}.`,
  transferred: (agent: string, target: string) =>
    `${agent} transferred this chat to ${target}.`,
  closed: (agent: string) => `Conversation closed by ${agent}.`,
  reopened: (agent: string) => `${agent} reopened the conversation.`,
};
