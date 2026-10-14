import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import {
  compactRefundFilters,
  createRefund,
  getRefundOptions,
  listRefunds,
  type CreateRefundInput,
  type RefundListFilters,
  type RefundListParams,
} from "./refunds-api";

function refundErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.message === "INVALID_TYPE") return "Select a valid type.";
    if (error.message === "INVALID_SALES_CHANNEL") return "Select a valid sales channel.";
    if (error.message === "INVALID_CURRENCY") return "Select a valid refund currency.";
    if (error.message === "INVALID_COUNTRY") return "Select a valid country.";
    if (error.message === "INVALID_COURIER") return "Select a valid courier.";
    if (error.message === "INVALID_REASON") return "Select a valid reason.";
    if (error.message === "INVALID_TAG") return "Select a valid tag.";
    if (error.message === "INVALID_ACCOUNTABLE") return "Select a valid department.";
    if (error.message === "INVALID_ITEM_RETURNED") return "Select whether the item was returned.";
    if (error.message === "REFUND_NOT_FOUND") return "Refund not found.";
    if (error.message === "INVALID_ATTACHMENT_TYPE") return "Attachments must be PNG, JPG, or PDF.";
    if (error.message === "ATTACHMENT_TOO_LARGE") return "Each attachment must be 10MB or smaller.";
    if (error.message === "TOO_MANY_ATTACHMENTS") return "You can attach up to 10 files.";
    if (error.message === "FORBIDDEN") return "You do not have permission to do that.";
    if (error.message) return error.message;
  }
  return fallback;
}

export function useRefundOptions(enabled = true) {
  return useQuery({
    queryKey: ["refund-options"],
    queryFn: async () => (await getRefundOptions()).data,
    enabled,
    staleTime: 60_000,
  });
}

export function useRefunds(filters: RefundListFilters, pagination: RefundListParams) {
  const applied = compactRefundFilters(filters);
  return useQuery({
    queryKey: ["refunds", applied, pagination],
    queryFn: async () => (await listRefunds(filters, pagination)).data,
    placeholderData: keepPreviousData,
  });
}

export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRefundInput) => createRefund(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["refunds"] });
      toast.success("Refund created");
    },
    onError: (error) => {
      toast.error(refundErrorMessage(error, "Could not create refund."));
    },
  });
}
