import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import {
  addTicketReply,
  compactTicketFilters,
  createTicket,
  deleteTicket,
  getTicket,
  getTicketOptions,
  listTickets,
  uploadBulkTickets,
  updateTicketStatus,
  type CreateReplyInput,
  type CreateTicketInput,
  type TicketListFilters,
  type TicketListParams,
} from "./tickets-api";

function ticketErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.message === "ASSIGNEE_NOT_FOUND" || error.message === "DEPARTMENT_NOT_FOUND") {
      return "Select a valid department.";
    }
    if (error.message === "INVALID_COURIER") return "Select a valid courier.";
    if (error.message === "INVALID_ISSUE") return "Select a valid issue.";
    if (error.message === "INVALID_STATUS") return "Select a valid status.";
    if (error.message === "TICKET_NOT_FOUND") return "Ticket not found.";
    if (error.message === "ORDER_ID_ALREADY_EXISTS") return "That order ID already exists.";
    if (error.message === "TRACKING_NUMBER_ALREADY_EXISTS") {
      return "That tracking number already exists.";
    }
    if (error.message === "INVALID_ATTACHMENT_TYPE") return "Attachments must be PNG, JPG, or PDF.";
    if (error.message === "ATTACHMENT_TOO_LARGE") return "Each attachment must be 10MB or smaller.";
    if (error.message === "TOO_MANY_ATTACHMENTS") return "You can attach up to 10 files.";
    if (error.message === "BULK_FILE_REQUIRED") return "Select a spreadsheet to upload.";
    if (error.message === "INVALID_BULK_FILE_TYPE") return "Upload a CSV, XLS, or XLSX file.";
    if (error.message === "BULK_FILE_TOO_LARGE") return "The spreadsheet must be 5MB or smaller.";
    if (error.message === "EMPTY_BULK_FILE") return "The spreadsheet has no ticket rows.";
    if (error.message === "TOO_MANY_BULK_ROWS") return "Upload no more than 500 tickets at once.";
    if (
      error.message === "BULK_VALIDATION_FAILED" ||
      error.message === "MISSING_BULK_COLUMNS"
    ) {
      const body = error.body as {
        details?: Array<{ row?: number; field?: string; message?: string }>;
      };
      const first = body?.details?.[0];
      return first
        ? `Row ${first.row}, ${first.field}: ${first.message}`
        : "Some spreadsheet rows are invalid.";
    }
    if (error.message === "FORBIDDEN") return "You do not have permission to do that.";
    if (error.message) return error.message;
  }
  return fallback;
}

export function useTickets(
  filters: TicketListFilters,
  pagination: TicketListParams
) {
  const applied = compactTicketFilters(filters);
  return useQuery({
    queryKey: ["tickets", applied, pagination],
    queryFn: async () => (await listTickets(filters, pagination)).data,
    placeholderData: keepPreviousData,
  });
}

export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => (await getTicket(ticketId as string)).data,
    enabled: Boolean(ticketId),
  });
}

export function useTicketOptions() {
  return useQuery({
    queryKey: ["ticket-options"],
    queryFn: async () => (await getTicketOptions()).data,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket created");
    },
    onError: (error) => {
      toast.error(ticketErrorMessage(error, "Could not create ticket."));
    },
  });
}

export function useBulkUploadTickets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadBulkTickets(file),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(`${result.data.createdCount} tickets created`);
    },
    onError: (error) => {
      toast.error(ticketErrorMessage(error, "Could not upload tickets."));
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tickets"] }),
        queryClient.invalidateQueries({ queryKey: ["ticket", variables.ticketId] }),
      ]);
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error(ticketErrorMessage(error, "Could not update status."));
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => deleteTicket(ticketId),
    onSuccess: async (_result, ticketId) => {
      queryClient.removeQueries({ queryKey: ["ticket", ticketId] });
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted");
    },
    onError: (error) => {
      toast.error(ticketErrorMessage(error, "Could not delete ticket."));
    },
  });
}

export function useAddTicketReply(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReplyInput) => addTicketReply(ticketId, input),
    onSuccess: async (result) => {
      queryClient.setQueryData(["ticket", ticketId], result.data);
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Reply added");
    },
    onError: (error) => {
      toast.error(ticketErrorMessage(error, "Could not add reply."));
    },
  });
}
