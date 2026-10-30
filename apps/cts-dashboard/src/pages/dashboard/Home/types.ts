export type RequestType = "tracking" | "refund" | "return" | "resend";

export type RequestStatus = "pending" | "processing" | "completed" | "rejected" | "failed";

export type DateRangePreset = "today" | "yesterday" | "last7" | "last30" | "last90" | "custom";

export type TrendGranularity = "hourly" | "daily" | "weekly" | "monthly";

export type ThemeMode = "light" | "dark";

export type SalesChannel = "Website" | "Amazon" | "eBay" | "TikTok Shop";

export type Currency = "GBP" | "EUR" | "USD";

export interface CustomDateRange {
  /** `yyyy-mm-dd`, inclusive. */
  from: string;
  /** `yyyy-mm-dd`, inclusive. */
  to: string;
}

export interface DashboardFilters {
  dateRange: DateRangePreset;
  customRange: CustomDateRange;
  requestType: RequestType | "all";
  status: RequestStatus | "all";
}

/** Half-open interval: `start` inclusive, `end` exclusive. */
export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodRange {
  current: DateRange;
  previous: DateRange;
}

export interface RequestEvent {
  status: RequestStatus;
  at: Date;
  note: string;
  actor: string;
}

export interface RequestRecord {
  id: string;
  type: RequestType;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  channel: SalesChannel;
  country: string;
  courier: string;
  reason: string;
  amount: number | null;
  currency: Currency;
  assignee: string;
  history: RequestEvent[];
}

export interface KpiBreakdownItem {
  status: RequestStatus;
  label: string;
  count: number;
  share: number;
}

export interface KpiSummary {
  type: RequestType;
  total: number;
  previousTotal: number;
  changePct: number | null;
  breakdown: KpiBreakdownItem[];
  resolutionRate: number;
}

export interface TrendSeries {
  type: RequestType;
  values: number[];
}

export interface TrendDataset {
  granularity: TrendGranularity;
  axisLabels: string[];
  tooltipLabels: string[];
  series: TrendSeries[];
}

export interface DistributionDatum {
  type: RequestType;
  count: number;
}

export type StatusMatrix = Record<RequestType, Record<RequestStatus, number>>;

export interface ComparisonDatum {
  type: RequestType;
  current: number;
  previous: number;
  changePct: number | null;
}

export interface ActivityItem {
  id: string;
  record: RequestRecord;
  title: string;
  at: Date;
}

export type SortDirection = "asc" | "desc";

export type RequestSortKey =
  | "id"
  | "customerName"
  | "type"
  | "orderId"
  | "status"
  | "createdAt"
  | "updatedAt";

export interface RequestSort {
  key: RequestSortKey;
  direction: SortDirection;
}
