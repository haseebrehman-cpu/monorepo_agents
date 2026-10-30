import { useMemo, useState } from "react";
import type { ChartTheme } from "../charts/chart-theme";
import EChart, { type EChartEventHandlers } from "../charts/EChart";
import { buildDistributionOption, type LegendSelection } from "../charts/options/distribution-option";
import type { DistributionDatum } from "../types";
import { ChartContainer } from "./ChartContainer";

const HEIGHT = 320;

interface RequestDistributionChartProps {
  data: DistributionDatum[];
  theme: ChartTheme;
  className?: string;
}

function isLegendEvent(params: unknown): params is { selected: LegendSelection } {
  return typeof params === "object" && params !== null && "selected" in params;
}

export function RequestDistributionChart({ data, theme, className }: RequestDistributionChartProps) {
  // Mirrors the legend so the centre total reflects only the visible slices.
  const [selection, setSelection] = useState<LegendSelection>({});
  const total = data.reduce((sum, datum) => sum + datum.count, 0);

  const option = useMemo(() => buildDistributionOption(data, selection, theme), [data, selection, theme]);

  const events = useMemo<EChartEventHandlers>(
    () => ({
      legendselectchanged: (params) => {
        if (isLegendEvent(params)) setSelection(params.selected);
      },
      restore: () => setSelection({}),
    }),
    [],
  );

  return (
    <ChartContainer
      title="Request distribution"
      description="Share of all requests by module"
      height={HEIGHT}
      isEmpty={total === 0}
      className={className}
    >
      <EChart option={option} height={HEIGHT} onEvents={events} ariaLabel="Donut chart of request share by module" />
    </ChartContainer>
  );
}
