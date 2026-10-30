import { useDeferredValue, useMemo, useState } from "react";
import { MODULES, REQUEST_STATUSES, TABLE_PAGE_SIZES } from "../constants";
import type {
  RequestRecord,
  RequestSort,
  RequestSortKey,
  RequestStatus,
  RequestType,
} from "../types";

const STATUS_RANK = Object.fromEntries(REQUEST_STATUSES.map((status, index) => [status, index])) as Record<
  RequestStatus,
  number
>;

function compare(a: RequestRecord, b: RequestRecord, key: RequestSortKey): number {
  switch (key) {
    case "createdAt":
    case "updatedAt":
      return a[key].getTime() - b[key].getTime();
    case "status":
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case "type":
      return MODULES[a.type].label.localeCompare(MODULES[b.type].label);
    case "id":
    case "orderId":
      return a[key].localeCompare(b[key], undefined, { numeric: true });
    case "customerName":
      return a.customerName.localeCompare(b.customerName);
  }
}

function matchesSearch(record: RequestRecord, query: string): boolean {
  return (
    record.id.toLowerCase().includes(query) ||
    record.orderId.toLowerCase().includes(query) ||
    record.customerName.toLowerCase().includes(query)
  );
}

export interface RequestTableState {
  search: string;
  setSearch: (value: string) => void;
  typeFilter: RequestType | "all";
  setTypeFilter: (value: RequestType | "all") => void;
  statusFilter: RequestStatus | "all";
  setStatusFilter: (value: RequestStatus | "all") => void;
  sort: RequestSort;
  toggleSort: (key: RequestSortKey) => void;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  rows: RequestRecord[];
  filteredCount: number;
  hasLocalFilters: boolean;
  clearLocalFilters: () => void;
}

export function useRequestTable(records: readonly RequestRecord[]): RequestTableState {
  const [search, setSearchValue] = useState("");
  const [typeFilter, setTypeFilterValue] = useState<RequestType | "all">("all");
  const [statusFilter, setStatusFilterValue] = useState<RequestStatus | "all">("all");
  const [sort, setSort] = useState<RequestSort>({ key: "updatedAt", direction: "desc" });
  const [page, setPageValue] = useState(0);
  const [pageSize, setPageSizeValue] = useState(TABLE_PAGE_SIZES[0]);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return records.filter(
      (record) =>
        (typeFilter === "all" || record.type === typeFilter) &&
        (statusFilter === "all" || record.status === statusFilter) &&
        (query === "" || matchesSearch(record, query)),
    );
  }, [deferredSearch, records, statusFilter, typeFilter]);

  const sorted = useMemo(() => {
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compare(a, b, sort.key) * direction);
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Global filters can shrink the record set underneath the current page.
  const safePage = Math.min(page, pageCount - 1);
  const rows = useMemo(
    () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [pageSize, safePage, sorted],
  );

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPageValue(0);
  };

  return {
    search,
    setSearch: resetPage(setSearchValue),
    typeFilter,
    setTypeFilter: resetPage(setTypeFilterValue),
    statusFilter,
    setStatusFilter: resetPage(setStatusFilterValue),
    sort,
    toggleSort: (key) => {
      setSort((current) =>
        current.key === key
          ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
          : { key, direction: key === "createdAt" || key === "updatedAt" ? "desc" : "asc" },
      );
      setPageValue(0);
    },
    page: safePage,
    pageCount,
    setPage: (next) => setPageValue(Math.min(Math.max(next, 0), pageCount - 1)),
    pageSize,
    setPageSize: resetPage(setPageSizeValue),
    rows,
    filteredCount: sorted.length,
    hasLocalFilters: search !== "" || typeFilter !== "all" || statusFilter !== "all",
    clearLocalFilters: () => {
      setSearchValue("");
      setTypeFilterValue("all");
      setStatusFilterValue("all");
      setPageValue(0);
    },
  };
}
