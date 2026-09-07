import { useQuery } from "@tanstack/react-query";
import { getTurn } from "./chat-api";
import { queryKeys } from "./query-keys";

export function useResumeTurn(
  conversationId?: string | null,
  turnId?: string | null,
) {
  return useQuery({
    queryKey: queryKeys.turn(conversationId ?? "", turnId ?? ""),
    queryFn: () => getTurn(conversationId!, turnId!),
    enabled: Boolean(conversationId && turnId),
    retry: false,
  });
}
