import { queryOptions, skipToken } from "@tanstack/react-query";
import type { SupportConversation, SupportStoreCode } from "@rdx/chat-contract";
import { readJson, removeItem, writeJson } from "@/lib/chat/storage";
import { api } from "./client";
import { isRestartConversationError, retryAfterMs, shouldRetryQuery } from "./errors";
import { supportKeys, type OrderLookupParams } from "./query-keys";

const conversationStorageKey = (store: SupportStoreCode) => `rdx-chat:conversation:${store}`;

export function forgetStoredConversation(store: SupportStoreCode): void {
  removeItem("session", conversationStorageKey(store));
}

export const healthQuery = () =>
  queryOptions({
    queryKey: supportKeys.health(),
    queryFn: ({ signal }) => api.support.health(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });

/**
 * One conversation per store per browser tab. It is kept in the cache forever
 * and seeded from sessionStorage, so reloads and store switches reuse it.
 */
export const conversationQuery = (store: SupportStoreCode) =>
  queryOptions({
    queryKey: supportKeys.conversation(store),
    queryFn: async ({ signal }) => {
      const conversation = await api.support.startConversation(store, signal);
      writeJson("session", conversationStorageKey(store), conversation);
      return conversation;
    },
    initialData: () => readJson<SupportConversation>("session", conversationStorageKey(store)),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: shouldRetryQuery,
    retryDelay: (_attempt, error) => retryAfterMs(error),
  });

export const pageEventsQuery = (store: SupportStoreCode, conversationId: string) =>
  queryOptions({
    queryKey: supportKeys.events(store, conversationId),
    queryFn: ({ signal }) => api.support.listEvents(conversationId, store, signal),
    select: (response) => response.events,
    staleTime: 15_000,
  });

/**
 * Lookups are cached per order and contact so re-opening a result doesn't
 * spend one of the 5 lookups per minute the API allows. If the server no
 * longer knows the conversation, `renewConversation` supplies a new id and the
 * lookup runs once more so the verified order is still remembered in the chat.
 */
export const orderLookupQuery = (
  params: OrderLookupParams | null,
  renewConversation?: () => Promise<string | null>,
) =>
  // renewConversation is a recovery callback, not an input the result depends on.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  queryOptions({
    queryKey: params ? supportKeys.orderLookup(params) : supportKeys.orderLookupIdle(),
    queryFn: params
      ? async ({ signal }) => {
          const run = (conversationId: string | null) =>
            api.support.lookupOrder(
              {
                store: params.store,
                order_number: params.orderNumber,
                email: params.email,
                postcode: params.postcode,
                conversation_id: conversationId,
              },
              signal,
            );
          try {
            return await run(params.conversationId);
          } catch (error) {
            if (!isRestartConversationError(error) || !params.conversationId || !renewConversation) {
              throw error;
            }
            return run(await renewConversation());
          }
        }
      : skipToken,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: shouldRetryQuery,
    retryDelay: (_attempt, error) => retryAfterMs(error),
  });
