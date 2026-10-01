import type { OrderVerifyRequest, OrderVerifyResponse } from "@rdx/chat-contract";
import type { CartScope } from "./cart";
import { type ApiClient } from "./http";
import { throwIfErrorPayload, withRetry } from "./errors";

export type OrderScope = CartScope;

function orderQuery(scope: OrderScope): string {
  const params = new URLSearchParams();
  if (scope.tenant) params.set("tenant", scope.tenant);
  if (scope.marketplace) params.set("marketplace", scope.marketplace);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function orderHeaders(scope: OrderScope): Record<string, string> {
  const headers: Record<string, string> = {};
  if (scope.sessionId) headers["X-Session-Id"] = scope.sessionId;
  return headers;
}

export async function verifyOrder(
  client: ApiClient,
  body: OrderVerifyRequest,
  scope: OrderScope = {},
): Promise<OrderVerifyResponse> {
  const payload = await withRetry(() =>
    client.request<OrderVerifyResponse>(`/v1/orders/verify${orderQuery(scope)}`, {
      method: "POST",
      headers: orderHeaders(scope),
      body: JSON.stringify(body),
    }),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export type OrdersApi = {
  verify: (
    body: OrderVerifyRequest,
    scope?: OrderScope,
  ) => Promise<OrderVerifyResponse>;
};

export function createOrdersApi(client: ApiClient): OrdersApi {
  return {
    verify: (body, scope) => verifyOrder(client, body, scope),
  };
}
