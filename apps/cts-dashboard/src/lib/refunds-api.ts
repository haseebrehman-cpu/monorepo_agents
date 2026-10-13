import { authedApi } from "./auth";
import { CTS_API_BASE_URL } from "./api";
import type { RefundRow } from "../pages/dashboard/Refund/tickets-table/columns";

type ApiResponse<T> = { success: true; data: T };

export type RefundListFilters = {
  type: string;
  salesChannel: string;
  refundCurrency: string;
  country: string;
  courierService: string;
  reason: string;
  tags: string;
  accountable: string;
  itemReturned: string;
};

export type RefundSortField =
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
  | "refundCurrency"
  | "refundPrice"
  | "shippingCost"
  | "country"
  | "courierService"
  | "trackingNumber"
  | "reason"
  | "tags"
  | "accountable"
  | "itemReturned";

export type RefundListParams = {
  page: number;
  pageSize: number;
  sortBy: RefundSortField;
  sortDirection: "asc" | "desc";
};

export type RefundListPage = {
  items: RefundRow[];
  total: number;
  page: number;
  pageSize: number;
};

export const EMPTY_REFUND_FILTERS: RefundListFilters = {
  type: "",
  salesChannel: "",
  refundCurrency: "",
  country: "",
  courierService: "",
  reason: "",
  tags: "",
  accountable: "",
  itemReturned: "",
};

export function compactRefundFilters(filters: RefundListFilters): Partial<RefundListFilters> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(value))
  ) as Partial<RefundListFilters>;
}

export type CreateRefundInput = {
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
  refundCurrency: string;
  refundPrice: string;
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

export function listRefunds(filters: RefundListFilters, pagination: RefundListParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(compactRefundFilters(filters))) {
    if (value) params.set(key, value);
  }
  params.set("page", String(pagination.page));
  params.set("pageSize", String(pagination.pageSize));
  params.set("sortBy", pagination.sortBy);
  params.set("sortDirection", pagination.sortDirection);
  return authedApi().request<ApiResponse<RefundListPage>>(`/api/refunds?${params.toString()}`);
}

export function getRefund(refundId: string) {
  return authedApi().request<ApiResponse<RefundRow>>(`/api/refunds/${encodeURIComponent(refundId)}`);
}

export type RefundOptions = {
  types: string[];
  salesChannels: string[];
  currencies: string[];
  countries: string[];
  reasons: string[];
  tags: string[];
  accountables: string[];
  itemReturned: string[];
};

export function getRefundOptions() {
  return authedApi().request<ApiResponse<RefundOptions>>("/api/refunds/options");
}

export function createRefund(input: CreateRefundInput) {
  const form = new FormData();
  const textFields: Array<keyof CreateRefundInput> = [
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
    "refundCurrency",
    "refundPrice",
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

  return authedApi().request<ApiResponse<RefundRow>>("/api/refunds", {
    method: "POST",
    body: form,
  });
}

export async function downloadRefundAttachment(attachmentId: number, fileName: string) {
  const response = await fetch(
    `${CTS_API_BASE_URL}/api/refunds/attachments/${attachmentId}`,
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
