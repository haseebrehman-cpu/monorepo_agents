import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@rdx/api-client";
import { getProductVariants } from "./product-api";
import { queryKeys } from "./query-keys";

/** 403 (feature off) and 404 (unknown listing) mean: hide the selector. */
export function isSelectorUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 403 || error.status === 404)
  );
}

export function useProductVariants(
  listingId: string,
  region: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.productVariants(region, listingId),
    queryFn: () => getProductVariants(listingId, region),
    enabled: enabled && Boolean(listingId),
    // Live prices and stock: never serve a stale selector for long.
    staleTime: 5_000,
    gcTime: 15_000,
    retry: false,
  });
}
