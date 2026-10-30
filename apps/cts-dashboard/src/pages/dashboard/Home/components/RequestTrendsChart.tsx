import { useMemo, useState } from "react";
import type { ChartTheme } from "../charts/chart-theme";
import EChart from "../charts/EChart";
import { buildTrendOption } from "../charts/options/trend-option";
import { GRANULARITY_OPTIONS } from "../constants";
import { availableGranularities, buildTrend } from "../lib/selectors";
import type { DateRange, RequestRecord, RequestType, TrendGranularity } from "../types";
import { ChartContainer } from "./ChartContainer";
import { SegmentedControl } from "./SegmentedControl";

const HEIGHT = 340;

interface RequestTrendsChartProps {
  records: readonly RequestRecord[];
  range: DateRange;
  types: readonly RequestType[];
  theme: ChartTheme;
  className?: string;
}

export function RequestTrendsChart({ records, range, types, theme, className }: RequestTrendsChartProps) {
  const [preferred, setPreferred] = useState<TrendGranularity>("daily");
  const available = useMemo(() => availableGranularities(range), [range]);
  const granularity = available.includes(preferred) ? preferred : available.includes("daily") ? "daily" : available[0];

  const option = useMemo(
    () => buildTrendOption(buildTrend(records, range, granularity, types), theme),
    [granularity, range, records, theme, types],
  );

  const options = useMemo(
    () =>
      GRANULARITY_OPTIONS.filter((item) => item.value !== "hourly" || available.includes("hourly")).map((item) => ({
        ...item,
        disabled: !available.includes(item.value),
      })),
    [available],
  );

  return (
    <ChartContainer
      title="Request trends"
      description="New requests per module over the selected period"
      height={HEIGHT}
      isEmpty={records.length === 0}
      className={className}
      actions={<SegmentedControl label="Trend interval" value={granularity} options={options} onChange={setPreferred} />}
    >
      <EChart option={option} height={HEIGHT} ariaLabel="Line chart of request volume over time by module" />
    </ChartContainer>
  );
}
