import { cn } from "@rdx/ui";
import { MODULES, STATUSES } from "../constants";
import type { RequestStatus, RequestType } from "../types";

interface StatusBadgeProps {
  status: RequestStatus;
  /** When provided, the module's own wording is used (e.g. "Delivered" for tracking). */
  type?: RequestType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const meta = STATUSES[status];
  const label = type ? (MODULES[type].stageLabels[status] ?? meta.label) : meta.label;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        meta.classes.badge,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", meta.classes.dot)} />
      {label}
    </span>
  );
}

export function RequestTypeBadge({ type, className }: { type: RequestType; className?: string }) {
  const meta = MODULES[type];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm whitespace-nowrap text-foreground", className)}>
      <span className={cn("flex size-6 items-center justify-center rounded-md ring-1 ring-inset", meta.classes.icon)}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      {meta.shortLabel}
    </span>
  );
}
