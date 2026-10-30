import { REQUEST_STATUSES, REQUEST_TYPES } from "../constants";
import type { RequestStatus, RequestType } from "../types";

export function toRequestTypeFilter(value: string | null): RequestType | "all" {
  return REQUEST_TYPES.find((type) => type === value) ?? "all";
}

export function toStatusFilter(value: string | null): RequestStatus | "all" {
  return REQUEST_STATUSES.find((status) => status === value) ?? "all";
}
