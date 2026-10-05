import type { ProductVariantsResponse } from "@rdx/chat-contract";
import type { CartScope } from "./cart";
import { ApiError, type ApiClient } from "./http";
import { throwIfErrorPayload, withRetry } from "./errors";

export type ProductScope = CartScope;

function productQuery(scope: ProductScope): string {
  const params = new URLSearchParams();
  if (scope.tenant) params.set("tenant", scope.tenant);
  if (scope.marketplace) params.set("marketplace", scope.marketplace);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function productHeaders(scope: ProductScope): Record<string, string> {
  const headers: Record<string, string> = {};
  if (scope.sessionId) headers["X-Session-Id"] = scope.sessionId;
  return headers;
}

export async function getProductVariants(
  client: ApiClient,
  listingId: string,
  scope: ProductScope = {},
): Promise<ProductVariantsResponse> {
  if (!listingId.trim()) {
    throw new ApiError("listing_id is required.", 400);
  }
  const payload = await withRetry(() =>
    client.request<ProductVariantsResponse>(
      `/v1/products/${encodeURIComponent(listingId)}/variants${productQuery(scope)}`,
      { headers: productHeaders(scope) },
    ),
  );
  throwIfErrorPayload(payload);
  return payload;
}

export type ProductsApi = {
  variants: (
    listingId: string,
    scope?: ProductScope,
  ) => Promise<ProductVariantsResponse>;
};

export function createProductsApi(client: ApiClient): ProductsApi {
  return {
    variants: (listingId, scope) => getProductVariants(client, listingId, scope),
  };
}
