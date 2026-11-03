export type ChatStatus = "waiting" | "active" | "resolved";

export type MessageAuthor = "customer" | "assistant" | "agent" | "system" | "note";

export type ChatMessage = {
  id: string;
  author: MessageAuthor;
  authorName: string;
  body: string;
  at: string;
};

export type LiveConversation = {
  id: string;
  customerName: string;
  customerEmail: string;
  channel: string;
  orderNumber: string | null;
  status: ChatStatus;
  queuedForId: string | null;
  ownerId: string | null;
  handoffReason: string;
  aiSummary: string;
  handedOffAt: string;
  updatedAt: string;
  unread: number;
  tags: string[];
  location: string;
  typing: boolean;
  messages: ChatMessage[];
  /** Latest non-system message, for list rows whose transcript is not loaded. */
  lastMessage?: ChatMessage | null;
  /** False for list rows. The full transcript loads when the chat is opened. */
  messagesLoaded?: boolean;
};

export type QueueFilter = "user_queue" | "active" | "team" | "closed";

export type ComposerMode = "reply" | "note";

export type SupportMember = {
  id: string;
  name: string;
  role: "agent" | "admin";
  limit: number;
  accepting: boolean;
  /** Waiting chats queued to this member, as counted by the server. */
  queued?: number;
  /** Active chats this member owns, as counted by the server. */
  taken?: number;
};
