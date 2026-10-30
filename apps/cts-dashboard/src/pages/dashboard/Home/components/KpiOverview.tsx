import type { KpiSummary, RequestType } from "../types";
import { KpiCard } from "./KpiCard";

interface KpiOverviewProps {
  kpis: KpiSummary[];
  selectedType: RequestType | "all";
  previousLabel: string;
  onOpenModule: (route: string) => void;
}

export function KpiOverview({ kpis, selectedType, previousLabel, onOpenModule }: KpiOverviewProps) {
  return (
    <section aria-label="Module overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {kpis.map((summary) => (
        <KpiCard
          key={summary.type}
          summary={summary}
          highlighted={selectedType === summary.type}
          dimmed={selectedType !== "all" && selectedType !== summary.type}
          previousLabel={previousLabel}
          onOpen={onOpenModule}
        />
      ))}
    </section>
  );
}
