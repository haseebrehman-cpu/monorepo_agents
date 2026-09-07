import { useQuery } from "@tanstack/react-query";
import { getHealthz } from "./chat-api";
import { queryKeys } from "./query-keys";

export function useHealthz() {
  return useQuery({
    queryKey: queryKeys.healthz,
    queryFn: getHealthz,
    staleTime: 30_000,
    retry: 1,
  });
}
