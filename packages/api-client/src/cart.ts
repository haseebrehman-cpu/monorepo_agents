import type {
  CartActionResponse,
  CartAddLineRequest,
  CartPatchLineRequest,
  CartSnapshot,
  MarketplaceCode,
} from "@rdx/chat-contract";
import { ApiError, type ApiClient } from "./http";
import { throwIfErrorPayload, withRetry } from "./errors";

export type CartScope = {
  tenant?: string | null;
  marketplace?: MarketplaceCode | null;
  sessionId?: string | null;
};

export type CartWriteOptions = CartScope & {
  actionId: string;
};

function cartQuery(scope: CartScope): string {
  const params = new URLSearchParams();
  if (scope.tenant) params.set("tenant", scope.tenant);
  if (scope.marketplace) params.set("marketplace", scope.marketplace);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function cartHeaders(scope: CartScope, actionId?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (scope.sessionId) headers["X-Session-Id"] = scope.sessionId;
  if (actionId) headers["Idempotency-Key"] = actionId;
  return headers;
}

function assertActionId(actionId: string): void {
  const trimmed = actionId.trim();
  if (!trimmed || trimmed === "string" || !/^cact_[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(trimmed)) {
    throw new ApiError("A valid cart Idempotency-Key is required.", 422);
  }
}

export async function getCart(
  client: ApiClient,
  scope: CartScope = {},
): Promise<CartSnapshot> {
  const payload = await withRetry(() =>
    client.request<CartSnapshot>(`/v1/cart${cartQuery(scope)}`, {
      headers: cartHeaders(scope),
    }),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export async function addCartLine(
  client: ApiClient,
  body: CartAddLineRequest,
  options: CartWriteOptions,
): Promise<CartActionResponse> {
  assertActionId(options.actionId);
  const payload = await withRetry(() =>
    client.request<CartActionResponse>(`/v1/cart/lines${cartQuery(options)}`, {
      method: "POST",
      headers: cartHeaders(options, options.actionId),
      body: JSON.stringify(body),
    }),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export async function patchCartLine(
  client: ApiClient,
  lineRef: string,
  body: CartPatchLineRequest,
  options: CartWriteOptions,
): Promise<CartActionResponse> {
  assertActionId(options.actionId);
  if (!lineRef.trim()) {
    throw new ApiError("line_ref is required.", 400);
  }
  const payload = await withRetry(() =>
    client.request<CartActionResponse>(
      `/v1/cart/lines/${encodeURIComponent(lineRef)}${cartQuery(options)}`,
      {
        method: "PATCH",
        headers: cartHeaders(options, options.actionId),
        body: JSON.stringify(body),
      },
    ),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export async function deleteCartLine(
  client: ApiClient,
  lineRef: string,
  options: CartWriteOptions,
): Promise<CartActionResponse> {
  assertActionId(options.actionId);
  if (!lineRef.trim()) {
    throw new ApiError("line_ref is required.", 400);
  }
  const payload = await withRetry(() =>
    client.request<CartActionResponse>(
      `/v1/cart/lines/${encodeURIComponent(lineRef)}${cartQuery(options)}`,
      {
        method: "DELETE",
        headers: cartHeaders(options, options.actionId),
      },
    ),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export async function getCartAction(
  client: ApiClient,
  actionId: string,
  scope: CartScope = {},
): Promise<CartActionResponse> {
  if (!actionId.trim()) {
    throw new ApiError("action_id is required.", 400);
  }
  const payload = await client.request<CartActionResponse>(
    `/v1/cart/actions/${encodeURIComponent(actionId)}${cartQuery(scope)}`,
    { headers: cartHeaders(scope) },
  );
  throwIfErrorPayload(payload);
  return payload;
}

export async function checkoutCart(
  client: ApiClient,
  options: CartWriteOptions,
): Promise<CartActionResponse> {
  assertActionId(options.actionId);
  const payload = await withRetry(() =>
    client.request<CartActionResponse>(`/v1/checkout${cartQuery(options)}`, {
      method: "POST",
      headers: cartHeaders(options, options.actionId),
    }),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export type CartApi = {
  get: (scope?: CartScope) => Promise<CartSnapshot>;
  addLine: (
    body: CartAddLineRequest,
    options: CartWriteOptions,
  ) => Promise<CartActionResponse>;
  patchLine: (
    lineRef: string,
    body: CartPatchLineRequest,
    options: CartWriteOptions,
  ) => Promise<CartActionResponse>;
  deleteLine: (
    lineRef: string,
    options: CartWriteOptions,
  ) => Promise<CartActionResponse>;
  getAction: (
    actionId: string,
    scope?: CartScope,
  ) => Promise<CartActionResponse>;
  checkout: (options: CartWriteOptions) => Promise<CartActionResponse>;
};

export function createCartApi(client: ApiClient): CartApi {
  return {
    get: (scope) => getCart(client, scope),
    addLine: (body, options) => addCartLine(client, body, options),
    patchLine: (lineRef, body, options) =>
      patchCartLine(client, lineRef, body, options),
    deleteLine: (lineRef, options) => deleteCartLine(client, lineRef, options),
    getAction: (actionId, scope) => getCartAction(client, actionId, scope),
    checkout: (options) => checkoutCart(client, options),
  };
}
