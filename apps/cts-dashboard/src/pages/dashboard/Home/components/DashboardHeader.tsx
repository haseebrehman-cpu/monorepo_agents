import { CalendarRange } from "lucide-react";
import { formatTime } from "../lib/format";

interface DashboardHeaderProps {
  currentLabel: string;
  previousLabel: string;
  updatedAt: Date;
}

export function DashboardHeader({ currentLabel, previousLabel, updatedAt }: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">CTS Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order tracking, refunds, returns and resends across every channel.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{currentLabel}</span>
          <span>vs {previousLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Updated {formatTime(updatedAt)}
        </span>
      </div>
    </div>
  );
}
