import type { ChatErrorResponse } from "@rdx/chat-contract";
import { ApiError } from "./http";

export function isErrorResponse(value: unknown): value is ChatErrorResponse {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = (value as ChatErrorResponse).error;
  if (typeof error === "string") return error.length > 0;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof error.message === "string"
  );
}

export function errorResponseMessage(payload: ChatErrorResponse): string {
  return typeof payload.error === "string"
    ? payload.error
    : payload.error.message;
}

export function throwIfErrorPayload(payload: unknown, status = 400): void {
  if (isErrorResponse(payload)) {
    throw new ApiError(errorResponseMessage(payload), status, payload, {
      code:
        typeof payload.error === "object" ? payload.error.code : undefined,
    });
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Retry 429/503 up to 2 times, honoring Retry-After (capped at 10s). */
export async function withRetry<T>(
  run: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await run();
    } catch (error) {
      const canRetry =
        error instanceof ApiError &&
        (error.status === 429 || error.status === 503) &&
        attempt < maxRetries;
      if (!canRetry) throw error;
      const delay = Math.min((error.retryAfter ?? 2) * 1000, 10_000);
      attempt += 1;
      await sleep(delay);
    }
  }
}
