import type { SessionResponse } from "@rdx/chat-contract";
import { ApiError, type ApiClient } from "./http";
import { throwIfErrorPayload } from "./errors";

/** POST /v1/session — requires a Shopify App Proxy signed query string. */
export async function createSession(
  client: ApiClient,
  queryString = "",
): Promise<SessionResponse> {
  const suffix = queryString
    ? queryString.startsWith("?")
      ? queryString
      : `?${queryString}`
    : "";

  const payload = await client.request<SessionResponse>(
    `/v1/session${suffix}`,
    { method: "POST" },
  );
  throwIfErrorPayload(payload);

  if (!payload.session_token) {
    throw new ApiError("Session token was missing from the response.", 502, payload);
  }

  return payload;
}

export type SessionApi = {
  create: (queryString?: string) => Promise<SessionResponse>;
};

export function createSessionApi(client: ApiClient): SessionApi {
  return {
    create: (queryString) => createSession(client, queryString),
  };
}
