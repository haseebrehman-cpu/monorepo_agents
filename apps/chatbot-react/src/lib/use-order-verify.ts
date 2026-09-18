import { useMutation } from "@tanstack/react-query";
import type { OrderVerifyRequest } from "@rdx/chat-contract";
import { verifyOrder } from "./order-api";

export function useVerifyOrder(region: string) {
  return useMutation({
    mutationFn: (body: OrderVerifyRequest) => verifyOrder({ region, body }),
    retry: false,
  });
}
