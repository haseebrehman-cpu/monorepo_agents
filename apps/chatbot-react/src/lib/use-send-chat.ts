import { useMutation } from "@tanstack/react-query";
import { sendChatMessage } from "./chat-api";

export function useSendChat() {
  return useMutation({
    mutationFn: sendChatMessage,
    retry: false,
  });
}
