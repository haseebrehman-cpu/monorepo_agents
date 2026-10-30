"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { api } from "./client";
import { errorCode, reportError } from "./errors";
import { supportKeys } from "./query-keys";
import { useConversationControls, useConversationId } from "./use-conversation";

export interface PageEventInput {
  type: string;
  data: Record<string, unknown>;
  summary?: string;
}

/**
 * Tells the chat what happened on the page, on the same conversation the
 * messages use (starting one if needed). Events are context only, so they are
 * skipped while the chat is paused for an answer.
 */
export function usePageEvent(store: SupportStoreCode, paused: boolean) {
  const queryClient = useQueryClient();
  const conversationId = useConversationId(store);
  const { withConversation } = useConversationControls(store);

  const mutation = useMutation({
    mutationFn: (event: PageEventInput) =>
      withConversation(async (id) => ({
        id,
        stored: await api.support.sendEvent(id, { store, ...event }),
      })),
    onSuccess: ({ id }) =>
      queryClient.invalidateQueries({ queryKey: supportKeys.events(store, id) }),
    onError: (error) => {
      if (errorCode(error) !== "conversation_waiting") reportError(error, "event");
    },
  });

  const { mutate } = mutation;
  const track = useCallback(
    (event: PageEventInput) => {
      if (paused) return;
      mutate(event);
    },
    [mutate, paused],
  );

  return { track, conversationId };
}
