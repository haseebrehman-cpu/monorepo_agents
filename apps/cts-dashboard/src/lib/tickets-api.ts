import { authedApi } from "./auth";
import { CTS_API_BASE_URL } from "./api";
import type { Ticket } from "../pages/dashboard/CTS/tickets-table/columns";

type ApiResponse<T> = { success: true; data: T };

export type TicketAssignee = {
  id: number;
  name: string;
  email: string;
  department?: string | null;
};

export type TicketOptions = {
  couriers: string[];
  issues: string[];
  statuses: string[];
  departments: Array<{ id: number; name: string }>;
  users?: TicketAssignee[];
};

export type TicketListFilters = {
  courier: string;
  issue: string;
  assignedTo: string;
  createdBy: string;
  status: string;
  fromDate: string;
  toDate: string;
  modifiedBy: string;
};

export const EMPTY_TICKET_FILTERS: TicketListFilters = {
  courier: "",
  issue: "",
  assignedTo: "",
  createdBy: "",
  status: "",
  fromDate: "",
  toDate: "",
  modifiedBy: "",
};

export function compactTicketFilters(filters: TicketListFilters): Partial<TicketListFilters> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ) as Partial<TicketListFilters>;
}

export type CreateTicketInput = {
  orderId: string;
  courier: string;
  trackingNumber: string;
  issue: string;
  comment?: string;
  assignedDepartmentId?: number | null;
  status?: string;
  attachments?: File[];
};

export type TicketAttachment = {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type TicketHistoryItem = {
  id: string;
  kind: "created" | "reply" | "status";
  authorName: string;
  authorDepartment: string | null;
  assignedToName: string | null;
  assignedToDepartment: string | null;
  bodyHtml: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
  attachments: TicketAttachment[];
};

export type CreatedTicket = Ticket & {
  dbId: number;
  orderId: string;
  comment: string;
  assignedDepartmentId: number | null;
  createdByDepartment?: string | null;
  attachments?: TicketAttachment[];
};

export type TicketDetail = CreatedTicket & {
  history: TicketHistoryItem[];
};

export type CreateReplyInput = {
  comment: string;
  assignedDepartmentId: number;
  attachments?: File[];
};

export type BulkUploadResult = {
  totalRows: number;
  createdCount: number;
};

export function listTickets(filters: TicketListFilters = EMPTY_TICKET_FILTERS) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(compactTicketFilters(filters))) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return authedApi().request<ApiResponse<CreatedTicket[]>>(
    `/api/tickets${query ? `?${query}` : ""}`
  );
}

export function getTicket(ticketId: string) {
  return authedApi().request<ApiResponse<TicketDetail>>(
    `/api/tickets/${encodeURIComponent(ticketId)}`
  );
}

export function getTicketOptions() {
  return authedApi().request<ApiResponse<TicketOptions>>("/api/tickets/options");
}

export function createTicket(input: CreateTicketInput) {
  const form = new FormData();
  form.append("orderId", input.orderId);
  form.append("courier", input.courier);
  form.append("trackingNumber", input.trackingNumber);
  form.append("issue", input.issue);
  form.append("comment", input.comment ?? "");
  form.append("status", input.status ?? "Not Started");
  if (input.assignedDepartmentId) {
    form.append("assignedDepartmentId", String(input.assignedDepartmentId));
  }
  for (const file of input.attachments ?? []) {
    form.append("attachments", file);
  }

  return authedApi().request<ApiResponse<CreatedTicket>>("/api/tickets", {
    method: "POST",
    body: form,
  });
}

export function uploadBulkTickets(file: File) {
  const form = new FormData();
  form.append("file", file);
  return authedApi().request<ApiResponse<BulkUploadResult>>("/api/tickets/bulk", {
    method: "POST",
    body: form,
  });
}

export function updateTicketStatus(ticketId: string, status: string) {
  return authedApi().request<ApiResponse<CreatedTicket>>(
    `/api/tickets/${encodeURIComponent(ticketId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export function deleteTicket(ticketId: string) {
  return authedApi().request<{ success: true }>(
    `/api/tickets/${encodeURIComponent(ticketId)}`,
    { method: "DELETE" }
  );
}

export function addTicketReply(ticketId: string, input: CreateReplyInput) {
  const form = new FormData();
  form.append("comment", input.comment);
  form.append("assignedDepartmentId", String(input.assignedDepartmentId));
  for (const file of input.attachments ?? []) {
    form.append("attachments", file);
  }

  return authedApi().request<ApiResponse<TicketDetail>>(
    `/api/tickets/${encodeURIComponent(ticketId)}/replies`,
    {
      method: "POST",
      body: form,
    }
  );
}

export async function downloadTicketAttachment(attachmentId: number, fileName: string) {
  const response = await fetch(
    `${CTS_API_BASE_URL}/api/tickets/attachments/${attachmentId}`,
    { credentials: "include" }
  );
  if (!response.ok) {
    throw new Error("DOWNLOAD_FAILED");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
