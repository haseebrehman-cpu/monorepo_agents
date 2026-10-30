import { cn, DropDown, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rdx/ui";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Inbox,
  Search,
  SearchX,
} from "lucide-react";
import { MODULES, REQUEST_STATUSES, REQUEST_TYPES, STATUSES, TABLE_PAGE_SIZES } from "../constants";
import { useRequestTable, type RequestTableState } from "../hooks/useRequestTable";
import { formatDateTime, formatNumber, formatRelative } from "../lib/format";
import { toRequestTypeFilter, toStatusFilter } from "../lib/guards";
import type { RequestRecord, RequestSortKey } from "../types";
import { EmptyState } from "./states";
import { RequestTypeBadge, StatusBadge } from "./StatusBadge";
import { cardClass, iconButtonClass, subtleButtonClass } from "./ui-classes";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...REQUEST_TYPES.map((type) => ({ value: type, label: MODULES[type].shortLabel })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...REQUEST_STATUSES.map((status) => ({ value: status, label: STATUSES[status].label })),
];

const PAGE_SIZE_OPTIONS = TABLE_PAGE_SIZES.map((size) => ({ value: String(size), label: `${size} / page` }));

const COLUMNS: readonly { key: RequestSortKey; label: string; className?: string }[] = [
  { key: "id", label: "Request ID" },
  { key: "customerName", label: "Customer" },
  { key: "type", label: "Type" },
  { key: "orderId", label: "Order ID" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Last updated" },
];

interface RecentRequestsTableProps {
  records: readonly RequestRecord[];
  now: Date;
  onView: (record: RequestRecord) => void;
  className?: string;
}

export function RecentRequestsTable({ records, now, onView, className }: RecentRequestsTableProps) {
  const table = useRequestTable(records);

  return (
    <section aria-labelledby="cts-recent-requests" className={cn(cardClass, "flex min-w-0 flex-col", className)}>
      <header className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 id="cts-recent-requests" className="text-sm font-semibold text-foreground">
            Recent requests
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatNumber(table.filteredCount)} of {formatNumber(records.length)} requests in this period
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="cts-request-search" className="sr-only">
              Search requests
            </label>
            <Input
              id="cts-request-search"
              type="search"
              placeholder="Search name, request or order ID"
              value={table.search}
              onChange={(event) => table.setSearch(event.target.value)}
              className="pl-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <DropDown
              id="cts-table-type"
              label="Type"
              options={TYPE_OPTIONS}
              value={table.typeFilter}
              onChange={(value) => table.setTypeFilter(toRequestTypeFilter(value))}
              className="w-full sm:w-32"
            />
            <DropDown
              id="cts-table-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={table.statusFilter}
              onChange={(value) => table.setStatusFilter(toStatusFilter(value))}
              className="w-full sm:w-36"
            />
          </div>
        </div>
      </header>

      {records.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests in this period"
          description="Requests matching the dashboard filters will appear here."
        />
      ) : table.rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching requests"
          description="Nothing matches your search or table filters."
          action={
            <button type="button" className={subtleButtonClass} onClick={table.clearLocalFilters}>
              Clear search and filters
            </button>
          }
        />
      ) : (
        <>
          <RequestRowsTable table={table} now={now} onView={onView} />
          <RequestRowsList table={table} now={now} onView={onView} />
          <Pagination table={table} />
        </>
      )}
    </section>
  );
}

interface RowsProps {
  table: RequestTableState;
  now: Date;
  onView: (record: RequestRecord) => void;
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />;
  return direction === "asc" ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />;
}

function RequestRowsTable({ table, now, onView }: RowsProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
            {COLUMNS.map((column) => {
              const active = table.sort.key === column.key;
              return (
                <TableHead
                  key={column.key}
                  aria-sort={active ? (table.sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  className="h-9 px-3 first:pl-5"
                >
                  <button
                    type="button"
                    onClick={() => table.toggleSort(column.key)}
                    className={cn(
                      "-mx-1 inline-flex cursor-pointer items-center gap-1 rounded px-1 text-xs font-medium tracking-wide uppercase transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {column.label}
                    <SortIcon active={active} direction={table.sort.direction} />
                  </button>
                </TableHead>
              );
            })}
            <TableHead className="h-9 px-3 pr-5 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((record) => (
            <TableRow key={record.id} className="border-border">
              <TableCell className="px-3 py-2.5 pl-5 font-mono text-xs font-medium text-foreground">{record.id}</TableCell>
              <TableCell className="px-3 py-2.5">
                <p className="font-medium text-foreground">{record.customerName}</p>
                <p className="text-xs text-muted-foreground">{record.country}</p>
              </TableCell>
              <TableCell className="px-3 py-2.5">
                <RequestTypeBadge type={record.type} />
              </TableCell>
              <TableCell className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{record.orderId}</TableCell>
              <TableCell className="px-3 py-2.5">
                <StatusBadge status={record.status} type={record.type} />
              </TableCell>
              <TableCell className="px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                {formatDateTime(record.createdAt)}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-xs text-muted-foreground" title={formatDateTime(record.updatedAt)}>
                {formatRelative(record.updatedAt, now)}
              </TableCell>
              <TableCell className="px-3 py-2.5 pr-5 text-right">
                <button
                  type="button"
                  onClick={() => onView(record)}
                  className={cn(subtleButtonClass, "h-7 px-2 text-xs")}
                  aria-label={`View details for ${record.id}`}
                >
                  <Eye className="size-3.5" aria-hidden />
                  View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RequestRowsList({ table, now, onView }: RowsProps) {
  return (
    <ul className="divide-y divide-border md:hidden">
      {table.rows.map((record) => (
        <li key={record.id}>
          <button
            type="button"
            onClick={() => onView(record)}
            className="flex w-full cursor-pointer flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-foreground">{record.id}</span>
              <StatusBadge status={record.status} type={record.type} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">{record.customerName}</span>
              <RequestTypeBadge type={record.type} className="text-xs" />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{record.orderId}</span>
              <span>Updated {formatRelative(record.updatedAt, now)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Page numbers around the current page, with gaps marked as null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([0, pageCount - 1, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 0 && value < pageCount).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) result.push(null);
    result.push(value);
  });
  return result;
}

function Pagination({ table }: { table: RequestTableState }) {
  const first = table.page * table.pageSize + 1;
  const last = Math.min(first + table.pageSize - 1, table.filteredCount);

  return (
    <footer className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground tabular-nums">{formatNumber(first)}</span>–
        <span className="font-medium text-foreground tabular-nums">{formatNumber(last)}</span> of{" "}
        <span className="font-medium text-foreground tabular-nums">{formatNumber(table.filteredCount)}</span>
      </p>
      <div className="flex items-center gap-2">
        <DropDown
          id="cts-table-page-size"
          label="Rows per page"
          options={PAGE_SIZE_OPTIONS}
          value={String(table.pageSize)}
          onChange={(value) => table.setPageSize(Number(value) || TABLE_PAGE_SIZES[0])}
          className="w-28"
        />
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => table.setPage(table.page - 1)}
            disabled={table.page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(table.page, table.pageCount).map((value, index) =>
              value === null ? (
                <span key={`gap-${index}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={value}
                  type="button"
                  onClick={() => table.setPage(value)}
                  aria-current={value === table.page ? "page" : undefined}
                  className={cn(
                    "h-8 min-w-8 cursor-pointer rounded-lg px-2 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                    value === table.page
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {value + 1}
                </button>
              ),
            )}
          </div>
          <span className="px-1 text-xs text-muted-foreground tabular-nums sm:hidden">
            {table.page + 1} / {table.pageCount}
          </span>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => table.setPage(table.page + 1)}
            disabled={table.page >= table.pageCount - 1}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </nav>
      </div>
    </footer>
  );
}
