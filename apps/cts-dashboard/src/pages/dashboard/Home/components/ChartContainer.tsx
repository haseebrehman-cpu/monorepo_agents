import type { ReactNode } from "react";
import { cn } from "@rdx/ui";
import { ChartNoAxesCombined } from "lucide-react";
import ChartErrorBoundary from "../charts/ChartErrorBoundary";
import { EmptyState } from "./states";
import { cardClass } from "./ui-classes";

interface ChartContainerProps {
  title: string;
  description: string;
  height: number;
  isEmpty: boolean;
  emptyDescription?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartContainer({
  title,
  description,
  height,
  isEmpty,
  emptyDescription = "There are no requests for the selected filters. Try widening the date range.",
  actions,
  className,
  children,
}: ChartContainerProps) {
  return (
    <section className={cn(cardClass, "flex min-w-0 flex-col p-4 sm:p-5", className)}>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {actions}
      </header>
      {isEmpty ? (
        <EmptyState
          height={height}
          icon={ChartNoAxesCombined}
          title="No data to chart"
          description={emptyDescription}
        />
      ) : (
        <ChartErrorBoundary height={height}>{children}</ChartErrorBoundary>
      )}
    </section>
  );
}
