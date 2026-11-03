"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupportCart, SupportStoreCode } from "@rdx/chat-contract";
import { api } from "./client";
import { reportError } from "./errors";
import { cartQuery } from "./queries";
import { supportKeys } from "./query-keys";
import { useConversationControls, useConversationId } from "./use-conversation";

export const EMPTY_CART: SupportCart = {
  cart_id: null,
  currency: "",
  items: [],
  item_count: 0,
  subtotal: 0,
  total: 0,
  checkout_url: null,
  expires_at: null,
};

/**
 * The conversation's Shopify cart. Reads and changes stay available while the
 * chat is answering. Each successful change replaces the cached cart, including
 * the latest `checkout_url`.
 */
export function useSupportCart(store: SupportStoreCode) {
  const queryClient = useQueryClient();
  const conversationId = useConversationId(store);
  const { withConversation } = useConversationControls(store);
  const query = useQuery(cartQuery(store, conversationId));

  const remember = async (id: string, cart: SupportCart) => {
    await queryClient.cancelQueries({ queryKey: supportKeys.cart(store, id) });
    queryClient.setQueryData(supportKeys.cart(store, id), cart);
  };

  const addItem = useMutation({
    mutationFn: (input: { variantId: string; quantity?: number }) =>
      withConversation(async (id) => {
        const cart = await api.support.addCartItem(id, {
          store,
          variant_id: input.variantId,
          quantity: input.quantity,
        });
        return { id, cart };
      }),
    onSuccess: ({ id, cart }) => remember(id, cart),
    onError: (error) => reportError(error, "cart"),
  });

  const updateItem = useMutation({
    mutationFn: (input: { variantId: string; quantity: number }) =>
      withConversation(async (id) => {
        const cart = await api.support.updateCartItem(id, input.variantId, {
          store,
          quantity: input.quantity,
        });
        return { id, cart };
      }),
    onSuccess: ({ id, cart }) => remember(id, cart),
    onError: (error) => reportError(error, "cart"),
  });

  const pendingVariantId = addItem.isPending
    ? addItem.variables?.variantId
    : updateItem.isPending
      ? updateItem.variables?.variantId
      : null;

  return {
    cart: query.data ?? EMPTY_CART,
    isLoading: query.isLoading && Boolean(conversationId),
    isUpdating: addItem.isPending || updateItem.isPending,
    pendingVariantId: pendingVariantId ?? null,
    refresh: query.refetch,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
  };
}
