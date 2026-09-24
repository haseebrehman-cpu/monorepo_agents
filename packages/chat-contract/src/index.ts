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
  /** Opaque id of this exact variant in this store. Posted to POST /v1/cart/lines. */
  listing_id?: string | null;
  price_min: string | null;
  price_max: string | null;
  compare_at_min: string | null;
  compare_at_max: string | null;
  price_currency: string;
  promotions: string[] | null;
  availability: string;
  stock_status: string;
  image_url: string | null;
  image_alt?: string | null;
  availability_as_of?: string | null;
  size_chart?: { url: string; alt?: string } | null;
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
  /** Present when the customer must prove an order is theirs. */
  order_verification?: OrderVerificationChallenge | null;
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
    order_verification?: OrderVerificationChallenge | null;
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
  order_verification?: OrderVerificationChallenge | null;
}

export interface ChatOption {
  id: string;
  label: string;
  enabled: boolean;
}

export type CartOutcome =
  | "succeeded"
  | "adjusted"
  | "failed"
  | "quote_stale"
  | "unknown"
  | "unresolved"
  | "busy"
  | "not_found"
  | "invalid";

export interface CartLine {
  line_ref: string;
  title: string;
  sku?: string | null;
  quantity: number;
  unit_amount: number;
  line_amount: number;
  currency: string;
  image_url?: string | null;
  product_url?: string | null;
  available?: boolean;
}

export interface CartSnapshot {
  cart_ref: string | null;
  currency?: string;
  empty: boolean;
  total_quantity?: number;
  subtotal?: number;
  total?: number;
  totals_are_estimates: boolean;
  unresolved_action_id?: string | null;
  messages?: string[];
  lines: CartLine[];
}

export interface CartAddLineRequest {
  listing_id: string;
  quantity: number;
  quoted_unit_amount?: number;
  quoted_currency?: string;
}

export interface CartPatchLineRequest {
  quantity: number;
}

export interface CartActionResponse {
  action_id: string;
  op: string;
  outcome: CartOutcome;
  reason?: string;
  cart?: CartSnapshot | null;
  requested_quantity?: number;
  resulting_quantity?: number;
  message_codes?: string[];
  checkout_url?: string | null;
  checkout_status?: string | null;
  note?: string | null;
  replayed?: boolean;
  retryable?: boolean;
}

export interface OrderVerificationField {
  name: string;
  type: string;
  label: string;
  max_length?: number;
  required?: boolean;
  autocomplete?: string;
  /** Optional value supplied by the chat API for form prefilling. */
  value?: string | null;
}

export interface OrderVerificationSubmit {
  method: string;
  path: string;
}

export interface OrderVerificationChallenge {
  message?: string;
  required: boolean;
  reason: string;
  order_reference?: string | null;
  factors: string[];
  fields: OrderVerificationField[];
  /** Optional values supplied by the chat API, keyed by field name. */
  values?: Record<string, string | null>;
  submit: OrderVerificationSubmit;
  expires_in_seconds?: number;
}

export interface OrderItem {
  title: string;
  quantity: number;
}

export interface OrderTracking {
  carrier?: string | null;
  number?: string | null;
  url?: string | null;
  link_status?: string | null;
}

export interface OrderShipment {
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  status?: string | null;
  estimated_delivery?: string | null;
  source_of_truth?: string | null;
  position?: number | null;
  of?: number | null;
  reference?: string | null;
  state?: string | null;
  state_label?: string | null;
  items?: OrderItem[];
  tracking?: OrderTracking[];
  link_status?: string | null;
  shipped_at?: string | null;
  in_transit_at?: string | null;
  delivered_at?: string | null;
  last_update_at?: string | null;
  estimate_passed?: boolean | null;
  stale?: boolean | null;
  attention?: string | null;
  courier_unavailable?: boolean | null;
}

export interface VerifiedOrder {
  order_number: string;
  status?: string | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  placed_at?: string | null;
  items?: OrderItem[];
  cancelled?: boolean | null;
  cancelled_at?: string | null;
  overall_state?: string | null;
  overall_label?: string | null;
  shipments?: OrderShipment[];
  unshipped_items?: OrderItem[];
  cancelled_shipments?: number | null;
  tracking_available?: boolean | null;
  needs_attention?: boolean | null;
}

export interface OrderVerifyRequest {
  order_number: string;
  email?: string;
  postcode?: string;
}

export interface OrderVerifyResponse {
  verified: boolean;
  locked: boolean;
  order_reference?: string | null;
  expires_in_seconds?: number;
  order?: VerifiedOrder | null;
  detail_unavailable?: boolean;
  note?: string | null;
  message?: string;
  attempts_remaining?: number;
  retryable?: boolean;
  challenge?: OrderVerificationChallenge | null;
  escalation_offered?: boolean;
}
