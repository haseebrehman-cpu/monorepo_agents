import { useMutation } from "@tanstack/react-query";
import { createSession } from "./chat-api";

export function useCreateSession() {
  return useMutation({
    mutationFn: (queryString?: string) => createSession(queryString),
    retry: false,
  });
}
