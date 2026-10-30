import { useMemo } from "react";
import type { ChartTheme } from "../charts/chart-theme";
import EChart from "../charts/EChart";
import { buildStatusOption } from "../charts/options/status-option";
import { REQUEST_STATUSES } from "../constants";
import type { RequestType, StatusMatrix } from "../types";
import { ChartContainer } from "./ChartContainer";

interface RequestStatusChartProps {
  matrix: StatusMatrix;
  types: readonly RequestType[];
  theme: ChartTheme;
  className?: string;
}

const HEIGHT = 320;

export function RequestStatusChart({ matrix, types, theme, className }: RequestStatusChartProps) {
  const total = types.reduce(
    (sum, type) => sum + REQUEST_STATUSES.reduce((rowSum, status) => rowSum + matrix[type][status], 0),
    0,
  );
  const option = useMemo(() => buildStatusOption(matrix, types, theme), [matrix, theme, types]);

  return (
    <ChartContainer
      title="Request status overview"
      description="Where requests in each module currently stand"
      height={HEIGHT}
      isEmpty={total === 0}
      className={className}
    >
      <EChart option={option} height={HEIGHT} ariaLabel="Stacked bar chart of request statuses per module" />
    </ChartContainer>
  );
}
