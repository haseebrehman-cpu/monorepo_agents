import { ApiError, supportRequestId } from "@rdx/api-client";
import type { SupportErrorCode } from "@rdx/chat-contract";

export type ErrorContext = "message" | "lookup" | "event" | "conversation";

const MESSAGE_COPY: Partial<Record<SupportErrorCode, string>> = {
  conversation_busy: "I'm still working on your last message. Please wait a moment.",
  conversation_waiting: "Please answer the question above first.",
  invalid_request: "That message couldn't be sent. Please shorten it and try again.",
  rate_limited: "You're sending messages quickly. Please wait a moment and try again.",
  upstream_unavailable: "Our assistant is temporarily unavailable. Please try again shortly.",
  internal_error: "Something went wrong on our side. Please try again.",
};

const LOOKUP_COPY: Partial<Record<SupportErrorCode, string>> = {
  invalid_request: "Enter your order number and the email or postcode used on the order.",
  rate_limited: "Too many lookups. Please wait a minute and try again.",
  order_lookup_unavailable: "We can't reach our order system right now. Please try again shortly.",
};

export const RESTART_CONVERSATION_CODES: ReadonlySet<string> = new Set([
  "conversation_not_found",
  "store_mismatch",
]);

export function errorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined;
}

/** The conversation is gone or belongs to another store, so a new one is needed. */
export function isRestartConversationError(error: unknown): boolean {
  const code = errorCode(error);
  return code !== undefined && RESTART_CONVERSATION_CODES.has(code);
}

export function retryAfterMs(error: unknown, fallbackSeconds = 2): number {
  const seconds = error instanceof ApiError ? error.retryAfter : undefined;
  return Math.min((seconds ?? fallbackSeconds) * 1000, 10_000);
}

/** Customer-facing wording chosen by `error.code`, never by the server's message. */
export function friendlyError(error: unknown, context: ErrorContext = "message"): string {
  const code = errorCode(error) as SupportErrorCode | undefined;
  const copy = context === "lookup" ? { ...MESSAGE_COPY, ...LOOKUP_COPY } : MESSAGE_COPY;
  if (code && copy[code]) return copy[code]!;
  if (error instanceof TypeError) {
    return "We couldn't reach the assistant. Check your connection and try again.";
  }
  return context === "lookup"
    ? "We couldn't check that order right now. Please try again."
    : "Something went wrong. Please try again.";
}

export function reportError(error: unknown, context: ErrorContext): string | undefined {
  const requestId = supportRequestId(error);
  console.error(`[chat:${context}]`, { code: errorCode(error), requestId, error });
  return requestId;
}

/** Retry once on 503 or a network failure. A 429 is shown, since lookups are capped per minute. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  if (error instanceof ApiError) return error.status === 503;
  return error instanceof TypeError;
}
