import { cn } from "@rdx/ui";
import { Activity } from "lucide-react";
import { MODULES, STATUSES } from "../constants";
import { formatDateTime, formatRelative } from "../lib/format";
import type { ActivityItem, RequestRecord } from "../types";
import { EmptyState } from "./states";
import { cardClass } from "./ui-classes";

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  now: Date;
  onSelect: (record: RequestRecord) => void;
  className?: string;
}

export function RecentActivityFeed({ activities, now, onSelect, className }: RecentActivityFeedProps) {
  return (
    <section aria-labelledby="cts-recent-activity" className={cn(cardClass, "flex min-w-0 flex-col", className)}>
      <header className="border-b border-border p-4 sm:p-5">
        <h2 id="cts-recent-activity" className="text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Latest status changes across all modules</p>
      </header>

      {activities.length === 0 ? (
        <EmptyState icon={Activity} title="No recent activity" description="Status changes for the selected filters will show up here." />
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {activities.map((activity, index) => {
            const { record } = activity;
            const module = MODULES[record.type];
            const status = STATUSES[record.status];
            const ModuleIcon = module.icon;
            const isLast = index === activities.length - 1;
            return (
              <li key={activity.id} className="relative">
                {!isLast ? (
                  <span aria-hidden className="absolute top-11 bottom-0 left-[1.6rem] w-px bg-border sm:left-[1.85rem]" />
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(record)}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-3"
                >
                  <span className="relative shrink-0">
                    <span className={cn("flex size-9 items-center justify-center rounded-full ring-1 ring-inset", module.classes.icon)}>
                      <ModuleIcon className="size-4" aria-hidden />
                    </span>
                    <span
                      aria-hidden
                      className={cn("absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card", status.classes.dot)}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{activity.title}</span>
                      <time
                        dateTime={activity.at.toISOString()}
                        title={formatDateTime(activity.at)}
                        className="shrink-0 text-[11px] text-muted-foreground"
                      >
                        {formatRelative(activity.at, now)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {record.customerName} · <span className="font-mono">{record.orderId}</span>
                    </span>
                    <span className={cn("mt-1 inline-flex items-center gap-1 text-[11px] font-medium", status.classes.icon)}>
                      <span className="sr-only">Status:</span>
                      {module.stageLabels[record.status] ?? status.label}
                      <span className="text-muted-foreground">· {record.id}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
