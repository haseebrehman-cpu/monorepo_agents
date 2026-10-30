import { MODULES, REQUEST_STATUSES, STATUSES } from "../../constants";
import { formatCompact, formatNumber, formatPercent } from "../../lib/format";
import { stageLabel } from "../../lib/selectors";
import type { RequestType, StatusMatrix } from "../../types";
import {
  baseLegend,
  baseTextStyle,
  baseToolbox,
  baseTooltip,
  categoryAxisStyle,
  gridWithLabels,
  tooltipFooter,
  tooltipHeader,
  tooltipRow,
  valueAxisStyle,
  type ChartTheme,
} from "../chart-theme";
import type { EChartsOption } from "../echarts";
import { numericValue, tooltipItems } from "./tooltip-params";

/** Segments narrower than this share of the longest bar would not fit a label. */
const LABEL_MIN_SHARE = 0.12;

export function buildStatusOption(
  matrix: StatusMatrix,
  types: readonly RequestType[],
  theme: ChartTheme,
): EChartsOption {
  const totals = types.map((type) =>
    REQUEST_STATUSES.reduce((sum, status) => sum + matrix[type][status], 0),
  );
  const longest = Math.max(...totals, 0);

  return {
    backgroundColor: "transparent",
    textStyle: baseTextStyle(theme),
    animationDurationUpdate: 450,
    grid: gridWithLabels({ left: 4, right: 8, top: 36, bottom: 32 }),
    legend: { ...baseLegend(theme), left: "center", bottom: 0, itemGap: 12 },
    toolbox: baseToolbox(theme, "cts-request-status", {
      magicType: { type: ["stack"], title: { stack: "Toggle stacked" } },
    }),
    tooltip: {
      ...baseTooltip(theme),
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" } },
      formatter: (params) => {
        const items = tooltipItems(params);
        const index = items[0]?.dataIndex ?? 0;
        const type = types[index];
        if (!type) return "";
        const total = totals[index] ?? 0;
        const rows = items
          .filter((item) => numericValue(item) > 0)
          .map((item) => {
            const status = REQUEST_STATUSES[item.seriesIndex ?? 0];
            const value = numericValue(item);
            const label = status ? stageLabel(type, status) : (item.seriesName ?? "");
            return tooltipRow(
              theme,
              String(item.color),
              label,
              formatNumber(value),
              total > 0 ? formatPercent(value / total) : undefined,
            );
          })
          .join("");
        return tooltipHeader(theme, MODULES[type].label) + rows + tooltipFooter(theme, "Total", formatNumber(total));
      },
    },
    xAxis: {
      type: "value",
      ...valueAxisStyle(theme),
      axisLabel: { ...valueAxisStyle(theme).axisLabel, formatter: (value: number) => formatCompact(value) },
    },
    yAxis: [
      {
        type: "category",
        inverse: true,
        data: types.map((type) => MODULES[type].shortLabel),
        ...categoryAxisStyle(theme),
        axisLabel: { ...categoryAxisStyle(theme).axisLabel, fontSize: 12, color: theme.text },
      },
      {
        type: "category",
        inverse: true,
        position: "right",
        data: totals.map((total) => formatNumber(total)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: theme.textMuted, fontSize: 11, fontWeight: 600 },
      },
    ],
    series: REQUEST_STATUSES.map((status) => ({
      id: status,
      name: STATUSES[status].label,
      type: "bar" as const,
      stack: "status",
      barMaxWidth: 26,
      color: theme.statuses[status],
      itemStyle: { borderColor: theme.surface, borderWidth: 1 },
      emphasis: { focus: "series" as const },
      label: {
        show: true,
        position: "inside" as const,
        color: "#ffffff",
        fontSize: 10,
        fontWeight: 600,
        formatter: (params: { value?: unknown }) => {
          const value = Number(params.value ?? 0);
          return longest > 0 && value / longest >= LABEL_MIN_SHARE ? formatNumber(value) : "";
        },
      },
      data: types.map((type) => matrix[type][status]),
    })),
  };
}
