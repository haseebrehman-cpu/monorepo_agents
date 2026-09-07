/** Shared chat/API contracts for the widget and dashboard (FastAPI). */

export type ChatRole = "user" | "assistant";

export type MarketplaceCode = "uk" | "usa" | "ca" | "eu" | "uae" | "intl";

export interface ChatRequestBody {
  message: string;
  conversation_id?: string | null;
  /** Development/staging only — ignored when X-Session-Token is present. */
  tenant?: string | null;
  /** Development/staging only — ignored when X-Session-Token is present. */
  marketplace?: MarketplaceCode | null;
  session_id?: string | null;
  /** Stable id for this logical send; reuse on retry, never regenerate. */
  client_message_id?: string | null;
}

export interface ChatCitation {
  chunk_id?: string;
  document_id?: string;
  title?: string;
  source_uri?: string | null;
  url?: string;
  source_version?: string;
  score?: number;
}

export interface ChatProductCard {
  title: string;
  url: string;
  handle: string;
  price_min: string | null;
  price_max: string | null;
  compare_at_min: string | null;
  compare_at_max: string | null;
  price_currency: string;
  promotions: string[] | null;
  availability: string;
  stock_status: string;
}

export interface ChatTokenUsage {
  in?: number;
  out?: number;
}

export interface ChatSuccessResponse {
  conversation_id: string;
  turn_id: string;
  answer: string;
  escalated?: boolean;
  degraded?: boolean;
  citations?: ChatCitation[];
  products?: ChatProductCard[];
  skill?: string | null;
  route_tier?: string | null;
  tokens?: ChatTokenUsage;
  cost_usd?: number;
  diagnostic?: unknown;
  fallback_reason?: string | null;
  replayed?: boolean;
}

export interface ChatErrorDetail {
  code: string;
  message: string;
}

export interface ChatErrorResponse {
  error: ChatErrorDetail | string;
}

export interface SessionResponse {
  session_token: string;
  expires_in: number;
  locale: string;
}

export interface ResumeTurnResponse {
  turn_id: string;
  status: string;
  answer: string;
  escalated: boolean;
  degraded: boolean;
  last_sequence_delivered: number;
}

export interface HealthzResponse {
  status: string;
  web?: string;
  db?: string;
  redis?: string;
  problems?: unknown[];
  [key: string]: unknown;
}

export type StreamEventType =
  | "status"
  | "meta"
  | "delta"
  | "replace"
  | "done"
  | "error";

export interface StreamStatusEvent {
  event: "status";
  data: { state: string };
}

export interface StreamMetaEvent {
  event: "meta";
  data: {
    conversation_id: string;
    turn_id: string;
    skill?: string | null;
  };
}

export interface StreamDeltaEvent {
  event: "delta";
  data: { text: string };
}

export interface StreamReplaceEvent {
  event: "replace";
  data: { text: string };
}

export interface StreamDoneEvent {
  event: "done";
  data: {
    escalated?: boolean;
    degraded?: boolean;
    citations?: ChatCitation[];
    products?: ChatProductCard[];
    cost_usd?: number;
    skill?: string | null;
  };
}

export interface StreamErrorEvent {
  event: "error";
  data: { message: string };
}

export type ChatStreamEvent =
  | StreamStatusEvent
  | StreamMetaEvent
  | StreamDeltaEvent
  | StreamReplaceEvent
  | StreamDoneEvent
  | StreamErrorEvent;

/** Server-verified media attached to an assistant turn (never model-authored). */
export type ChatAttachment = {
  kind: "size_chart";
  productId: string;
  productTitle: string;
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  showMenu?: boolean;
  attachments?: ChatAttachment[];
  products?: ChatProductCard[];
  citations?: ChatCitation[];
  escalated?: boolean;
  degraded?: boolean;
}

export interface ChatOption {
  id: string;
  label: string;
  enabled: boolean;
}
