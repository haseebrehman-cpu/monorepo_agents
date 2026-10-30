import { useMemo } from "react";
import type { ChartTheme } from "../charts/chart-theme";
import EChart from "../charts/EChart";
import { buildComparisonOption } from "../charts/options/comparison-option";
import type { ComparisonDatum } from "../types";
import { ChartContainer } from "./ChartContainer";

const HEIGHT = 320;

interface RequestComparisonChartProps {
  data: ComparisonDatum[];
  periodLabels: { current: string; previous: string };
  theme: ChartTheme;
  className?: string;
}

export function RequestComparisonChart({ data, periodLabels, theme, className }: RequestComparisonChartProps) {
  const isEmpty = data.every((datum) => datum.current === 0 && datum.previous === 0);
  const option = useMemo(() => buildComparisonOption(data, periodLabels, theme), [data, periodLabels, theme]);

  return (
    <ChartContainer
      title="Request volume comparison"
      description="Current period against the previous period of equal length"
      height={HEIGHT}
      isEmpty={isEmpty}
      className={className}
    >
      <EChart option={option} height={HEIGHT} ariaLabel="Grouped bar chart comparing current and previous request volume" />
    </ChartContainer>
  );
}
