"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { isRestartConversationError } from "./errors";
import { conversationQuery, forgetStoredConversation } from "./queries";

/** The cached conversation id for a store, without creating one. */
export function useConversationId(store: SupportStoreCode): string | null {
  const { data } = useQuery({ ...conversationQuery(store), enabled: false });
  return data?.conversation_id ?? null;
}

export function useConversationControls(store: SupportStoreCode) {
  const queryClient = useQueryClient();

  /** The store's conversation id, starting a conversation if there is none yet. */
  const ensure = useCallback(async () => {
    const conversation = await queryClient.fetchQuery(conversationQuery(store));
    return conversation.conversation_id;
  }, [queryClient, store]);

  const forget = useCallback(() => {
    forgetStoredConversation(store);
    queryClient.removeQueries({ queryKey: conversationQuery(store).queryKey });
  }, [queryClient, store]);

  /** Drops the current conversation and starts a new one. */
  const renew = useCallback(() => {
    forget();
    return ensure();
  }, [ensure, forget]);

  /**
   * Runs a request against the store's conversation. If the server lost it
   * (restart, redeploy) or it belongs to another store, starts a new one and
   * runs the request once more.
   */
  const withConversation = useCallback(
    async <T>(request: (conversationId: string) => Promise<T>): Promise<T> => {
      try {
        return await request(await ensure());
      } catch (error) {
        if (!isRestartConversationError(error)) throw error;
        return request(await renew());
      }
    },
    [ensure, renew],
  );

  return { ensure, forget, renew, withConversation };
}
