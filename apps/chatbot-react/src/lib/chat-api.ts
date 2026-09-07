import { createRdxApiClient } from "@rdx/api-client";
import type {
  ChatRequestBody,
  ChatStreamEvent,
  MarketplaceCode,
} from "@rdx/chat-contract";

const STAGING_API_URL = "https://backend-staging-1a2f.up.railway.app";

const MARKETPLACES = new Set<MarketplaceCode>([
  "uk",
  "usa",
  "ca",
  "eu",
  "uae",
  "intl",
]);

function readMarketplace(value: string | undefined): MarketplaceCode {
  const code = (value ?? "uk").trim().toLowerCase();
  return MARKETPLACES.has(code as MarketplaceCode)
    ? (code as MarketplaceCode)
    : "uk";
}

function isLocalBrowserHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function resolveBaseUrl(): string {
  const configured = (import.meta.env.VITE_CHAT_API_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  // Local Vite (dev/preview) stays same-origin so the /rdx-api proxy can
  // bypass staging CORS. Production (Vercel) must call the backend origin.
  if (isLocalBrowserHost()) {
    return "/rdx-api";
  }

  return configured || STAGING_API_URL;
}

const baseUrl = resolveBaseUrl();

const sessionToken = import.meta.env.VITE_SESSION_TOKEN?.trim();

export const api = createRdxApiClient({
  baseUrl,
  headers: sessionToken ? { "X-Session-Token": sessionToken } : undefined,
});

export type SendChatInput = {
  message: string;
  conversation_id?: string | null;
  client_message_id?: string | null;
};

function withScope(input: SendChatInput): ChatRequestBody {
  return {
    message: input.message,
    conversation_id: input.conversation_id ?? undefined,
    client_message_id: input.client_message_id ?? undefined,
    ...(sessionToken
      ? {}
      : {
          tenant: import.meta.env.VITE_TENANT?.trim() || "rdx",
          marketplace: readMarketplace(import.meta.env.VITE_MARKETPLACE),
        }),
  };
}

export function sendChatMessage(input: SendChatInput) {
  return api.chat.send(withScope(input));
}

export function streamChatMessage(
  input: SendChatInput,
  onEvent?: (event: ChatStreamEvent) => void,
) {
  return api.stream.send(withScope(input), { onEvent });
}

export function createSession(queryString?: string) {
  return api.session.create(queryString);
}

export function getTurn(conversationId: string, turnId: string) {
  return api.chat.getTurn(conversationId, turnId);
}

export function getHealthz() {
  return api.health.get();
}
