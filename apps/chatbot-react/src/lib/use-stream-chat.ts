import { useMutation } from "@tanstack/react-query";
import type { ChatStreamEvent } from "@rdx/chat-contract";
import { streamChatMessage, type SendChatInput } from "./chat-api";

export type StreamChatVariables = SendChatInput & {
  onEvent?: (event: ChatStreamEvent) => void;
};

export function useStreamChat() {
  return useMutation({
    mutationFn: ({ onEvent, ...input }: StreamChatVariables) =>
      streamChatMessage(input, onEvent),
    retry: false,
  });
}
