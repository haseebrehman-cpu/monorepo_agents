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
  currentPage: string;
  visits: number;
  browser: string;
  referrer: string;
  typing: boolean;
  messages: ChatMessage[];
};

export type QueueFilter = "queued" | "mine" | "team" | "closed";

export type ComposerMode = "reply" | "note";

export type SupportMember = {
  id: string;
  name: string;
  role: "agent" | "admin";
  limit: number;
  accepting: boolean;
};
