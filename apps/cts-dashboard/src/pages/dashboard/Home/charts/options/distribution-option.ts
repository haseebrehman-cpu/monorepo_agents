import { MODULES } from "../../constants";
import { formatNumber, formatPercent } from "../../lib/format";
import type { DistributionDatum } from "../../types";
import {
  baseLegend,
  baseTextStyle,
  baseToolbox,
  baseTooltip,
  CHART_FONT,
  tooltipHeader,
  tooltipRow,
  type ChartTheme,
} from "../chart-theme";
import type { EChartsOption } from "../echarts";
import { numericValue, tooltipItems } from "./tooltip-params";

/** Legend selection keyed by series data name, as ECharts reports it. */
export type LegendSelection = Record<string, boolean>;

export function buildDistributionOption(
  data: DistributionDatum[],
  selection: LegendSelection,
  theme: ChartTheme,
): EChartsOption {
  const visibleTotal = data
    .filter((datum) => selection[MODULES[datum.type].shortLabel] !== false)
    .reduce((sum, datum) => sum + datum.count, 0);

  return {
    backgroundColor: "transparent",
    textStyle: baseTextStyle(theme),
    animationDurationUpdate: 450,
    toolbox: baseToolbox(theme, "cts-request-distribution"),
    title: {
      text: formatNumber(visibleTotal),
      subtext: "Total requests",
      left: "center",
      top: "40%",
      itemGap: 4,
      textStyle: { color: theme.text, fontFamily: CHART_FONT, fontSize: 24, fontWeight: 700 },
      subtextStyle: { color: theme.textMuted, fontFamily: CHART_FONT, fontSize: 12 },
    },
    legend: {
      ...baseLegend(theme),
      bottom: 0,
      left: "center",
      selected: selection,
    },
    tooltip: {
      ...baseTooltip(theme),
      trigger: "item",
      formatter: (params) => {
        const [item] = tooltipItems(params);
        const datum = data[item?.dataIndex ?? -1];
        if (!item || !datum) return "";
        const share = typeof item.percent === "number" ? item.percent / 100 : 0;
        return (
          tooltipHeader(theme, MODULES[datum.type].label) +
          tooltipRow(theme, String(item.color), "Requests", formatNumber(numericValue(item))) +
          tooltipRow(theme, String(item.color), "Share of visible", formatPercent(share))
        );
      },
    },
    series: [
      {
        id: "distribution",
        name: "Request distribution",
        type: "pie",
        radius: ["50%", "70%"],
        center: ["50%", "47%"],
        padAngle: 2,
        minAngle: 4,
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: theme.surface, borderWidth: 2 },
        label: {
          show: true,
          position: "outside",
          formatter: (params: { percent?: number; value?: unknown }) =>
            `{pct|${(params.percent ?? 0).toFixed(1)}%}\n{count|${formatNumber(Number(params.value ?? 0))}}`,
          rich: {
            pct: { color: theme.text, fontFamily: CHART_FONT, fontSize: 12, fontWeight: 600, lineHeight: 16 },
            count: { color: theme.textMuted, fontFamily: CHART_FONT, fontSize: 11, lineHeight: 14 },
          },
        },
        labelLine: { length: 8, length2: 8, lineStyle: { color: theme.axisLine } },
        emphasis: {
          scale: true,
          scaleSize: 6,
          itemStyle: { shadowBlur: 12, shadowColor: "rgba(0, 0, 0, 0.18)" },
        },
        data: data.map((datum) => ({
          name: MODULES[datum.type].shortLabel,
          value: datum.count,
          itemStyle: { color: theme.modules[datum.type] },
        })),
      },
    ],
  };
}
