"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { isEmail } from "@/lib/chat/intents";
import { friendlyError } from "./errors";
import { orderLookupQuery } from "./queries";
import type { OrderLookupParams } from "./query-keys";
import { useConversationControls } from "./use-conversation";

/**
 * Drives the tracking form. Submitting sets the lookup params, which runs the
 * cached query. Passing the chat's conversation id lets the agents remember
 * the verified order for follow-up questions. The id is optional for the API,
 * so the lookup still runs without it if no conversation can be started.
 */
export function useOrderLookup(store: SupportStoreCode) {
  const { ensure, renew } = useConversationControls(store);
  const [params, setParams] = useState<OrderLookupParams | null>(null);
  const renewConversation = useCallback(() => renew().catch(() => null), [renew]);
  const query = useQuery(orderLookupQuery(params, renewConversation));

  const lookup = useCallback(
    async (orderNumber: string, contact: string) => {
      const value = contact.trim();
      const byEmail = isEmail(value);
      const conversationId = await ensure().catch(() => null);
      setParams({
        store,
        orderNumber: orderNumber.trim(),
        email: byEmail ? value : null,
        postcode: byEmail ? null : value,
        conversationId,
      });
    },
    [ensure, store],
  );

  const clear = useCallback(() => setParams(null), []);

  return {
    lookup,
    clear,
    submitted: params,
    result: query.data,
    isLoading: query.isFetching,
    error: query.error ? friendlyError(query.error, "lookup") : null,
  };
}
