"use client";

import { useMutation } from "@tanstack/react-query";
import type { SupportReply, SupportStoreCode } from "@rdx/chat-contract";
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
  const { withConversation } = useConversationControls(store);

  return useMutation<SupportReply, unknown, SendMessageInput>({
    mutationKey: [...supportKeys.conversation(store), "send"],
    mutationFn: async ({ message, menuChoice = null, signal }) => {
      const send = () =>
        withConversation((conversationId) =>
          api.support.sendMessage(
            conversationId,
            { store, message, menu_choice: menuChoice },
            signal,
          ),
        );

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
