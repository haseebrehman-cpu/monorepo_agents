import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  PackageSearch,
  ReceiptText,
  Repeat2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type {
  DashboardFilters,
  DateRangePreset,
  RequestStatus,
  RequestType,
  TrendGranularity,
} from "./types";

export const REQUEST_TYPES: readonly RequestType[] = ["tracking", "refund", "return", "resend"];

export const REQUEST_STATUSES: readonly RequestStatus[] = [
  "pending",
  "processing",
  "completed",
  "rejected",
  "failed",
];

export interface ModuleMeta {
  label: string;
  shortLabel: string;
  description: string;
  route: string;
  idPrefix: string;
  icon: LucideIcon;
  /** Statuses this module actually uses, in display order. */
  statuses: readonly RequestStatus[];
  /** Module-specific wording for each status it uses. */
  stageLabels: Partial<Record<RequestStatus, string>>;
  classes: {
    icon: string;
    dot: string;
    text: string;
    ring: string;
  };
}

export const MODULES: Record<RequestType, ModuleMeta> = {
  tracking: {
    label: "Order Tracking",
    shortLabel: "Tracking",
    description: "Shipment tracking requests",
    route: "/tracking",
    idPrefix: "TRK",
    icon: PackageSearch,
    statuses: ["completed", "processing", "pending", "failed"],
    stageLabels: {
      completed: "Delivered",
      processing: "In transit",
      pending: "Pending",
      failed: "Failed",
    },
    classes: {
      icon: "bg-blue-50 text-blue-600 ring-blue-600/10 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20",
      dot: "bg-blue-600 dark:bg-blue-400",
      text: "text-blue-700 dark:text-blue-300",
      ring: "ring-2 ring-blue-500/50",
    },
  },
  refund: {
    label: "Refund Requests",
    shortLabel: "Refunds",
    description: "Customer refund claims",
    route: "/refund",
    idPrefix: "RFD",
    icon: ReceiptText,
    statuses: ["completed", "processing", "pending", "rejected"],
    stageLabels: {
      completed: "Approved",
      processing: "Processing",
      pending: "Pending",
      rejected: "Rejected",
    },
    classes: {
      icon: "bg-violet-50 text-violet-600 ring-violet-600/10 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
      dot: "bg-violet-600 dark:bg-violet-400",
      text: "text-violet-700 dark:text-violet-300",
      ring: "ring-2 ring-violet-500/50",
    },
  },
  return: {
    label: "Return Requests",
    shortLabel: "Returns",
    description: "Product return authorisations",
    route: "/return",
    idPrefix: "RTN",
    icon: Undo2,
    statuses: ["completed", "processing", "pending", "rejected"],
    stageLabels: {
      completed: "Completed",
      processing: "Approved",
      pending: "Pending",
      rejected: "Rejected",
    },
    classes: {
      icon: "bg-orange-50 text-orange-600 ring-orange-600/10 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/20",
      dot: "bg-orange-500 dark:bg-orange-400",
      text: "text-orange-700 dark:text-orange-300",
      ring: "ring-2 ring-orange-500/50",
    },
  },
  resend: {
    label: "Resend Requests",
    shortLabel: "Resends",
    description: "Replacement shipments",
    route: "/resend",
    idPrefix: "RSD",
    icon: Repeat2,
    statuses: ["completed", "processing", "pending", "failed"],
    stageLabels: {
      completed: "Processed",
      processing: "Processing",
      pending: "Pending",
      failed: "Failed",
    },
    classes: {
      icon: "bg-teal-50 text-teal-600 ring-teal-600/10 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/20",
      dot: "bg-teal-600 dark:bg-teal-400",
      text: "text-teal-700 dark:text-teal-300",
      ring: "ring-2 ring-teal-500/50",
    },
  },
};

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  classes: {
    badge: string;
    dot: string;
    bar: string;
    icon: string;
  };
}

export const STATUSES: Record<RequestStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    classes: {
      badge: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
      dot: "bg-amber-500 dark:bg-amber-400",
      bar: "bg-amber-400 dark:bg-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
    },
  },
  processing: {
    label: "Processing",
    icon: LoaderCircle,
    classes: {
      badge: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
      dot: "bg-sky-500 dark:bg-sky-400",
      bar: "bg-sky-500 dark:bg-sky-400",
      icon: "text-sky-600 dark:text-sky-400",
    },
  },
  completed: {
    label: "Completed",
    icon: CircleCheck,
    classes: {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
      dot: "bg-emerald-500 dark:bg-emerald-400",
      bar: "bg-emerald-500 dark:bg-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
  },
  rejected: {
    label: "Rejected",
    icon: CircleX,
    classes: {
      badge: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25",
      dot: "bg-red-500 dark:bg-red-400",
      bar: "bg-red-500 dark:bg-red-400",
      icon: "text-red-600 dark:text-red-400",
    },
  },
  failed: {
    label: "Failed",
    icon: CircleAlert,
    classes: {
      badge: "bg-rose-100 text-rose-900 ring-rose-800/25 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-700/40",
      dot: "bg-rose-800 dark:bg-rose-600",
      bar: "bg-rose-800 dark:bg-rose-600",
      icon: "text-rose-800 dark:text-rose-500",
    },
  },
};

export const DATE_RANGE_OPTIONS: readonly { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 days" },
  { value: "last30", label: "Last 30 days" },
  { value: "last90", label: "Last 90 days" },
  { value: "custom", label: "Custom" },
];

export const GRANULARITY_OPTIONS: readonly { value: TrendGranularity; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: "last30",
  customRange: { from: "", to: "" },
  requestType: "all",
  status: "all",
};

export const ACTIVITY_TITLES: Record<RequestType, Partial<Record<RequestStatus, string>>> = {
  tracking: {
    pending: "Tracking request created",
    processing: "Order in transit",
    completed: "Order successfully delivered",
    failed: "Tracking request failed",
  },
  refund: {
    pending: "Refund request submitted",
    processing: "Refund processing",
    completed: "Refund request approved",
    rejected: "Refund request rejected",
  },
  return: {
    pending: "Return request submitted",
    processing: "Return approved, awaiting item",
    completed: "Return completed",
    rejected: "Return request rejected",
  },
  resend: {
    pending: "Resend request submitted",
    processing: "Resend being prepared",
    completed: "Resend request processed",
    failed: "Resend request failed",
  },
};

export const TABLE_PAGE_SIZES: readonly number[] = [10, 25, 50];

export const ACTIVITY_FEED_LIMIT = 12;
