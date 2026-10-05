import { cartScope } from "./cart-api";
import { api } from "./chat-api";

export function getProductVariants(
  listingId: string,
  region?: string | null,
) {
  return api.products.variants(listingId, cartScope(region));
}
