"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupportReply, SupportStoreCode } from "@rdx/chat-contract";
import { toolMutatedCart } from "./cart-tool";
import { api } from "./client";
import { errorCode, retryAfterMs } from "./errors";
import { supportKeys } from "./query-keys";
import { useConversationControls } from "./use-conversation";

export interface SendMessageInput {
  message: string;
  menuChoice?: string | null;
  signal: AbortSignal;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/**
 * Sends one message on the store's conversation and resolves with the reply.
 * Recovers once from conditions where the server never processed it: a lost
 * or other-store conversation (start a new one) and a busy conversation (wait
 * for Retry-After).
 */
export function useSendMessage(store: SupportStoreCode) {
  const queryClient = useQueryClient();
  const { withConversation } = useConversationControls(store);

  const refreshCart = () => {
    void queryClient.invalidateQueries({
      queryKey: supportKeys.conversation(store),
      predicate: (query) => query.queryKey.at(-1) === "cart",
    });
  };

  return useMutation<SupportReply, unknown, SendMessageInput>({
    mutationKey: [...supportKeys.conversation(store), "send"],
    mutationFn: async ({ message, menuChoice = null, signal }) => {
      const send = () =>
        withConversation(async (conversationId) => {
          let mutated = false;
          try {
            return await api.support.streamMessage(
              conversationId,
              { store, message, menu_choice: menuChoice },
              {
                signal,
                onEvent: (event) => {
                  if (event.event === "tool" && toolMutatedCart(event.data.tool, event.data.outcome)) {
                    mutated = true;
                  }
                },
              },
            );
          } finally {
            if (mutated) refreshCart();
          }
        });

      try {
        return await send();
      } catch (error) {
        if (errorCode(error) === "conversation_busy") {
          await wait(retryAfterMs(error), signal);
          return send();
        }
        throw error;
      }
    },
  });
}
