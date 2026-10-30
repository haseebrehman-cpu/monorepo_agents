import { memo } from "react";
import { cn } from "@rdx/ui";
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { MODULES, STATUSES } from "../constants";
import { formatChange, formatNumber, formatPercent } from "../lib/format";
import type { KpiSummary } from "../types";
import { cardClass } from "./ui-classes";

interface KpiCardProps {
  summary: KpiSummary;
  highlighted: boolean;
  dimmed: boolean;
  previousLabel: string;
  onOpen: (route: string) => void;
}

function TrendPill({ changePct }: { changePct: number | null }) {
  const direction = changePct === null || changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
        direction === "up" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
        direction === "down" && "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
        direction === "flat" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {formatChange(changePct)}
    </span>
  );
}

function KpiCardComponent({ summary, highlighted, dimmed, previousLabel, onOpen }: KpiCardProps) {
  const meta = MODULES[summary.type];
  const Icon = meta.icon;

  return (
    <article
      aria-label={meta.label}
      className={cn(
        cardClass,
        "group flex h-full flex-col p-4 transition-[opacity,box-shadow] duration-200 sm:p-5",
        highlighted && meta.classes.ring,
        dimmed && "opacity-55 hover:opacity-100",
      )}
    >
      <header className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", meta.classes.icon)}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{meta.label}</h3>
          <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <p className="text-3xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
          {formatNumber(summary.total)}
        </p>
        <div className="flex flex-col items-end gap-0.5">
          <TrendPill changePct={summary.changePct} />
          <span className="text-[11px] text-muted-foreground" title={`Previous period: ${previousLabel}`}>
            vs {formatNumber(summary.previousTotal)} previous
          </span>
        </div>
      </div>

      <div
        className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={summary.breakdown.map((item) => `${item.label} ${formatPercent(item.share)}`).join(", ")}
      >
        {summary.breakdown.map((item) => (
          <span
            key={item.status}
            className={cn("h-full transition-[width] duration-500", STATUSES[item.status].classes.bar)}
            style={{ width: `${item.share * 100}%` }}
          />
        ))}
      </div>

      <dl className="mt-3 mb-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {summary.breakdown.map((item) => (
          <div key={item.status} className="flex min-w-0 items-center gap-2">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUSES[item.status].classes.dot)} />
            <dt className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-xs font-semibold text-foreground tabular-nums">{formatNumber(item.count)}</dd>
          </div>
        ))}
      </dl>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{formatPercent(summary.resolutionRate)}</span> resolved
        </span>
        <button
          type="button"
          onClick={() => onOpen(meta.route)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            meta.classes.text,
          )}
        >
          View {meta.shortLabel.toLowerCase()}
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </button>
      </footer>
    </article>
  );
}

export const KpiCard = memo(KpiCardComponent);
