import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartActionResponse, CartSnapshot } from "@rdx/chat-contract";
import {
  addCartLine,
  changeCartLine,
  emptyCart,
  getCart,
  removeCartLine,
  startCheckout,
  type AddCartLineInput,
} from "./cart-api";
import { queryKeys } from "./query-keys";

const EMPTY_CART = emptyCart();

function applyCartResult(
  queryClient: ReturnType<typeof useQueryClient>,
  region: string,
  result: CartActionResponse,
) {
  if (result.cart) {
    queryClient.setQueryData(queryKeys.cart(region), result.cart);
    return;
  }
  if (
    result.outcome === "unknown" ||
    result.outcome === "unresolved" ||
    result.outcome === "not_found" ||
    result.outcome === "invalid"
  ) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart(region) });
  }
}

export function useCart(region: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart(region),
    queryFn: () => getCart(region),
    enabled,
    staleTime: 15_000,
    placeholderData: EMPTY_CART,
  });
}

export function useAddCartLine(region: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<AddCartLineInput, "region">) =>
      addCartLine({ ...input, region }),
    onSuccess: (result) => applyCartResult(queryClient, region, result),
  });
}

export function useChangeCartLine(region: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { lineRef: string; quantity: number }) =>
      changeCartLine({ ...input, region }),
    onSuccess: (result) => applyCartResult(queryClient, region, result),
  });
}

export function useRemoveCartLine(region: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { lineRef: string }) =>
      removeCartLine({ ...input, region }),
    onSuccess: (result) => applyCartResult(queryClient, region, result),
  });
}

export function useCheckout(region: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startCheckout({ region }),
    onSuccess: (result) => applyCartResult(queryClient, region, result),
  });
}

export function readCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  region: string,
): CartSnapshot | undefined {
  return queryClient.getQueryData(queryKeys.cart(region));
}
