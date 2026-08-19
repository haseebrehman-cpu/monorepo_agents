/** Shared chat/API contracts for the widget, dashboard, and future server. */

export type ChatRole = "user" | "assistant";

export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
}

/** Server-verified media attached to an assistant turn (never model-authored). */
export type ChatAttachment = {
  kind: "size_chart";
  productId: string;
  productTitle: string;
  /** Allowlisted HTTPS size-chart image URL. */
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

/** Result of one agent turn — text plus optional verified attachments. */
export interface ChatAgentResult {
  reply: string;
  attachments?: ChatAttachment[];
}

export interface ChatRequestBody {
  /** Preferred: single user turn; server owns history. */
  message?: string;
  /** Legacy: full history — only the last user message is used. */
  messages?: ChatMessagePayload[];
  region?: string;
}

export interface ChatSuccessResponse {
  reply: string;
  requestId?: string;
  /** Server-verified attachments (e.g. product size charts). */
  attachments?: ChatAttachment[];
}

export interface ChatErrorResponse {
  error: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: string;
  /** Original ("was") price when the variant is discounted; null otherwise. */
  compareAtPrice: string | null;
  availableForSale: boolean;
  inventoryQuantity: number | null;
}

export interface ProductSummary {
  id: string;
  title: string;
  status: string;
  /** URL-safe storefront slug from Shopify. */
  handle: string;
  /**
   * Public product page URL for the customer storefront.
   * Null when neither SHOPIFY_STOREFRONT_URL nor Shopify onlineStoreUrl is available.
   */
  url: string | null;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  priceRange: {
    min: string;
    max: string;
    currency: string;
  };
  /** True when at least one variant has a compare-at price above its price. */
  onSale: boolean;
  totalInventory: number | null;
  variants: ProductVariant[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** When true, render the quick-option menu under this assistant message. */
  showMenu?: boolean;
  /** Server-verified attachments (e.g. size charts) — never model-authored. */
  attachments?: ChatAttachment[];
}

export interface ChatOption {
  id: string;
  
  label: string;
  enabled: boolean;
}
