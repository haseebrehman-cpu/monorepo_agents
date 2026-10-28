import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import {
  compactResendFilters,
  createResend,
  getResendOptions,
  listResends,
  type CreateResendInput,
  type ResendListFilters,
  type ResendListParams,
} from "./resends-api";

function resendErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.message === "INVALID_TYPE") return "Select a valid type.";
    if (error.message === "INVALID_SALES_CHANNEL") return "Select a valid sales channel.";
    if (error.message === "INVALID_COUNTRY") return "Select a valid country.";
    if (error.message === "INVALID_REASON") return "Select a valid reason.";
    if (error.message === "INVALID_TAG") return "Select a valid tag.";
    if (error.message === "INVALID_ACCOUNTABLE") return "Select a valid department.";
    if (error.message === "INVALID_ITEM_RETURNED") return "Select whether the item was returned.";
    if (error.message === "RESEND_NOT_FOUND") return "Resend not found.";
    if (error.message === "INVALID_ATTACHMENT_TYPE") return "Attachments must be PNG, JPG, or PDF.";
    if (error.message === "ATTACHMENT_TOO_LARGE") return "Each attachment must be 10MB or smaller.";
    if (error.message === "TOO_MANY_ATTACHMENTS") return "You can attach up to 10 files.";
    if (error.message === "FORBIDDEN") return "You do not have permission to do that.";
    if (error.message) return error.message;
  }
  return fallback;
}

export function useResendOptions(enabled = true) {
  return useQuery({
    queryKey: ["resend-options"],
    queryFn: async () => (await getResendOptions()).data,
    enabled,
    staleTime: 60_000,
  });
}

export function useResends(filters: ResendListFilters, pagination: ResendListParams) {
  const applied = compactResendFilters(filters);
  return useQuery({
    queryKey: ["resends", applied, pagination],
    queryFn: async () => (await listResends(filters, pagination)).data,
    placeholderData: keepPreviousData,
  });
}

export function useCreateResend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateResendInput) => createResend(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["resends"] });
      toast.success("Resend created");
    },
    onError: (error) => {
      toast.error(resendErrorMessage(error, "Could not create resend."));
    },
  });
}
