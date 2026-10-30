import type { SupportStoreCode } from "@rdx/chat-contract";

export interface OrderLookupParams {
  store: SupportStoreCode;
  orderNumber: string;
  email: string | null;
  postcode: string | null;
  conversationId: string | null;
}

export const supportKeys = {
  all: ["support"] as const,
  health: () => [...supportKeys.all, "health"] as const,
  conversation: (store: SupportStoreCode) => [...supportKeys.all, "conversation", store] as const,
  events: (store: SupportStoreCode, conversationId: string) =>
    [...supportKeys.conversation(store), conversationId, "events"] as const,
  orderLookupIdle: () => [...supportKeys.all, "order-lookup", "idle"] as const,
  orderLookup: (params: OrderLookupParams) =>
    [
      ...supportKeys.all,
      "order-lookup",
      params.store,
      params.orderNumber.toUpperCase(),
      params.email?.toLowerCase() ?? null,
      params.postcode?.toUpperCase() ?? null,
      params.conversationId,
    ] as const,
};
