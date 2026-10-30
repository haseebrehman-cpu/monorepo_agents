import { MODULES } from "../../constants";
import { formatChange, formatCompact, formatNumber } from "../../lib/format";
import type { ComparisonDatum } from "../../types";
import {
  baseLegend,
  baseTextStyle,
  baseToolbox,
  baseTooltip,
  categoryAxisStyle,
  CHART_FONT,
  gridWithLabels,
  tooltipFooter,
  tooltipHeader,
  tooltipRow,
  valueAxisStyle,
  withAlpha,
  type ChartTheme,
} from "../chart-theme";
import type { EChartsOption } from "../echarts";

const PREVIOUS = "Previous period";
const CURRENT = "Current period";

export function buildComparisonOption(
  data: ComparisonDatum[],
  periodLabels: { current: string; previous: string },
  theme: ChartTheme,
): EChartsOption {
  return {
    backgroundColor: "transparent",
    textStyle: baseTextStyle(theme),
    animationDurationUpdate: 450,
    grid: gridWithLabels({ left: 4, right: 8, top: 52, bottom: 4 }),
    legend: {
      ...baseLegend(theme),
      left: 0,
      top: 0,
      right: 120,
      data: [
        { name: PREVIOUS, itemStyle: { color: theme.previous } },
        { name: CURRENT, itemStyle: { color: theme.current } },
      ],
    },
    toolbox: baseToolbox(theme, "cts-request-comparison"),
    tooltip: {
      ...baseTooltip(theme),
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" } },
      formatter: (params) => {
        const index = Array.isArray(params) ? (params[0]?.dataIndex ?? 0) : params.dataIndex;
        const datum = data[index];
        if (!datum) return "";
        const color = theme.modules[datum.type];
        const delta = datum.current - datum.previous;
        const changeColor = delta >= 0 ? theme.positive : theme.negative;
        return (
          tooltipHeader(theme, MODULES[datum.type].label) +
          tooltipRow(theme, color, `Current · ${periodLabels.current}`, formatNumber(datum.current)) +
          tooltipRow(theme, withAlpha(color, 0.35), `Previous · ${periodLabels.previous}`, formatNumber(datum.previous)) +
          tooltipFooter(
            theme,
            "Change",
            `<span style="color:${changeColor}">${delta >= 0 ? "+" : ""}${formatNumber(delta)} (${formatChange(datum.changePct)})</span>`,
          )
        );
      },
    },
    xAxis: {
      type: "category",
      data: data.map((datum) => MODULES[datum.type].shortLabel),
      ...categoryAxisStyle(theme),
      axisLabel: { ...categoryAxisStyle(theme).axisLabel, fontSize: 12, color: theme.text },
    },
    yAxis: {
      type: "value",
      ...valueAxisStyle(theme),
      axisLabel: { ...valueAxisStyle(theme).axisLabel, formatter: (value: number) => formatCompact(value) },
    },
    series: [
      {
        id: "previous",
        name: PREVIOUS,
        type: "bar",
        barGap: "12%",
        barMaxWidth: 34,
        color: theme.previous,
        itemStyle: { borderRadius: [5, 5, 0, 0] },
        emphasis: { focus: "series" },
        data: data.map((datum) => ({
          value: datum.previous,
          itemStyle: { color: withAlpha(theme.modules[datum.type], theme.mode === "dark" ? 0.3 : 0.25) },
        })),
      },
      {
        id: "current",
        name: CURRENT,
        type: "bar",
        barMaxWidth: 34,
        color: theme.current,
        itemStyle: { borderRadius: [5, 5, 0, 0] },
        emphasis: { focus: "series" },
        label: {
          show: true,
          position: "top",
          distance: 6,
          formatter: (params: { dataIndex: number }) => {
            const datum = data[params.dataIndex];
            if (!datum || datum.changePct === null) return "";
            const style = datum.changePct >= 0 ? "up" : "down";
            const arrow = datum.changePct >= 0 ? "▲" : "▼";
            return `{${style}|${arrow} ${Math.abs(datum.changePct).toFixed(1)}%}`;
          },
          rich: {
            up: { color: theme.positive, fontFamily: CHART_FONT, fontSize: 10, fontWeight: 600 },
            down: { color: theme.negative, fontFamily: CHART_FONT, fontSize: 10, fontWeight: 600 },
          },
        },
        data: data.map((datum) => ({
          value: datum.current,
          itemStyle: { color: theme.modules[datum.type] },
        })),
      },
    ],
  };
}
