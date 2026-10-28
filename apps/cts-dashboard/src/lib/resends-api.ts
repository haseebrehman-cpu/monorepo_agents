import { authedApi } from "./auth";
import { CTS_API_BASE_URL } from "./api";
import type { ResendRow } from "../pages/dashboard/Resend/tickets-table/columns";

type ApiResponse<T> = { success: true; data: T };

export type ResendListFilters = {
  type: string;
  salesChannel: string;
  country: string;
  courierService: string;
  reason: string;
  tags: string;
  accountable: string;
  itemReturned: string;
};

export type ResendSortField =
  | "createdAt"
  | "referenceNo"
  | "orderId"
  | "categoryName"
  | "email"
  | "type"
  | "salesChannel"
  | "sku"
  | "title"
  | "quantity"
  | "salePrice"
  | "shippingCost"
  | "country"
  | "courierService"
  | "trackingNumber"
  | "reason"
  | "tags"
  | "accountable"
  | "itemReturned";

export type ResendListParams = {
  page: number;
  pageSize: number;
  sortBy: ResendSortField;
  sortDirection: "asc" | "desc";
};

export type ResendListPage = {
  items: ResendRow[];
  total: number;
  page: number;
  pageSize: number;
};

export const EMPTY_RESEND_FILTERS: ResendListFilters = {
  type: "",
  salesChannel: "",
  country: "",
  courierService: "",
  reason: "",
  tags: "",
  accountable: "",
  itemReturned: "",
};

const RESEND_FILTER_KEYS = Object.keys(EMPTY_RESEND_FILTERS) as (keyof ResendListFilters)[];

export function compactResendFilters(filters: ResendListFilters): Partial<ResendListFilters> {
  return Object.fromEntries(
    RESEND_FILTER_KEYS.filter((key) => Boolean(filters[key])).map((key) => [key, filters[key]])
  ) as Partial<ResendListFilters>;
}

export type CreateResendInput = {
  referenceNo: string;
  orderId: string;
  categoryName: string;
  email: string;
  type: string;
  salesChannel: string;
  sku: string;
  title: string;
  quantity: string;
  salePrice: string;
  shippingCost: string;
  country: string;
  courierService: string;
  trackingNumber: string;
  reason: string;
  tags: string;
  accountable: string;
  itemReturned: string;
  buyerComment: string;
  comment: string;
  issueListing: boolean;
  issueWarehouse: boolean;
  issueLogistics: boolean;
  issueFactory: boolean;
  attachments?: File[];
};

export function listResends(filters: ResendListFilters, pagination: ResendListParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(compactResendFilters(filters))) {
    if (value) params.set(key, value);
  }
  params.set("page", String(pagination.page));
  params.set("pageSize", String(pagination.pageSize));
  params.set("sortBy", pagination.sortBy);
  params.set("sortDirection", pagination.sortDirection);
  return authedApi().request<ApiResponse<ResendListPage>>(`/api/resends?${params.toString()}`);
}

export function getResend(resendId: string) {
  return authedApi().request<ApiResponse<ResendRow>>(`/api/resends/${encodeURIComponent(resendId)}`);
}

export type ResendOptions = {
  types: string[];
  salesChannels: string[];
  countries: string[];
  reasons: string[];
  tags: string[];
  accountables: string[];
  itemReturned: string[];
};

export function getResendOptions() {
  return authedApi().request<ApiResponse<ResendOptions>>("/api/resends/options");
}

export function createResend(input: CreateResendInput) {
  const form = new FormData();
  const textFields: Array<keyof CreateResendInput> = [
    "referenceNo",
    "orderId",
    "categoryName",
    "email",
    "type",
    "salesChannel",
    "sku",
    "title",
    "quantity",
    "salePrice",
    "shippingCost",
    "country",
    "courierService",
    "trackingNumber",
    "reason",
    "tags",
    "accountable",
    "itemReturned",
    "buyerComment",
    "comment",
  ];
  for (const field of textFields) {
    form.append(field, String(input[field] ?? ""));
  }
  form.append("issueListing", String(input.issueListing));
  form.append("issueWarehouse", String(input.issueWarehouse));
  form.append("issueLogistics", String(input.issueLogistics));
  form.append("issueFactory", String(input.issueFactory));
  for (const file of input.attachments ?? []) {
    form.append("attachments", file);
  }

  return authedApi().request<ApiResponse<ResendRow>>("/api/resends", {
    method: "POST",
    body: form,
  });
}

export async function downloadResendAttachment(attachmentId: number, fileName: string) {
  const response = await fetch(
    `${CTS_API_BASE_URL}/api/resends/attachments/${attachmentId}`,
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
