"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { SupportStoreCode } from "@rdx/chat-contract";
import { friendlyError, reportError } from "@/lib/api/errors";
import { useConversationControls } from "@/lib/api/use-conversation";
import { useSendMessage } from "@/lib/api/use-send-message";
import { createId } from "./format";
import { isMainMenuRequest } from "./intents";
import { readJson, removeItem, writeJson } from "./storage";
import {
  INITIAL_TRANSCRIPT,
  isHome,
  pendingInput,
  transcriptReducer,
  type ChatMessage,
} from "./transcript";

const transcriptKey = (store: SupportStoreCode) => `rdx-chat:transcript:${store}`;

function loadTranscript(store: SupportStoreCode): ChatMessage[] {
  return readJson<ChatMessage[]>("session", transcriptKey(store)) ?? INITIAL_TRANSCRIPT;
}

export interface SendOptions {
  /** Shown as the customer's bubble instead of the sent text. */
  displayText?: string;
  /** The server menu item id, for menu clicks. */
  menuChoice?: string;
}

export function useSupportChat(store: SupportStoreCode) {
  const [messages, dispatch] = useReducer(transcriptReducer, store, loadTranscript);
  const inFlight = useRef<AbortController | null>(null);
  const { forget } = useConversationControls(store);
  const { mutate, reset: resetMutation, isPending } = useSendMessage(store);

  useEffect(() => {
    if (isHome(messages)) removeItem("session", transcriptKey(store));
    else writeJson("session", transcriptKey(store), messages);
  }, [messages, store]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const send = useCallback(
    (text: string, options: SendOptions = {}) => {
      const message = text.trim();
      if (!message || isPending) return;
      const at = Date.now();
      dispatch({ type: "user", id: createId(), text: options.displayText?.trim() || message, at });

      if (!options.menuChoice && isMainMenuRequest(message)) {
        dispatch({ type: "menu", id: createId(), at });
        return;
      }

      const controller = new AbortController();
      inFlight.current = controller;
      mutate(
        { message, menuChoice: options.menuChoice, signal: controller.signal },
        {
          onSuccess: (reply) => {
            if (controller.signal.aborted) return;
            dispatch({ type: "reply", id: createId(), reply, at: Date.now() });
          },
          onError: (error) => {
            if (controller.signal.aborted) return;
            const requestId = reportError(error, "message");
            dispatch({
              type: "error",
              id: createId(),
              text: friendlyError(error, "message"),
              requestId,
              at: Date.now(),
            });
          },
          onSettled: () => {
            if (inFlight.current !== controller) return;
            inFlight.current = null;
          },
        },
      );
    },
    [isPending, mutate],
  );

  const reset = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
    resetMutation();
    forget();
    dispatch({ type: "reset" });
  }, [forget, resetMutation]);

  return {
    messages,
    isTyping: isPending,
    pendingInput: pendingInput(messages),
    send,
    reset,
  };
}

export type SupportChat = ReturnType<typeof useSupportChat>;
