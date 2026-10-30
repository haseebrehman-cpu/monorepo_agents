import { MODULES } from "../../constants";
import { formatCompact, formatNumber } from "../../lib/format";
import type { TrendDataset } from "../../types";
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
  withAlpha,
  type ChartTheme,
} from "../chart-theme";
import type { EChartsOption } from "../echarts";
import { numericValue, tooltipItems } from "./tooltip-params";

/** Beyond this many points the slider is worth the vertical space it takes. */
const SLIDER_THRESHOLD = 16;

export function buildTrendOption(data: TrendDataset, theme: ChartTheme): EChartsOption {
  const showSlider = data.axisLabels.length > SLIDER_THRESHOLD;
  const single = data.series.length === 1;

  return {
    backgroundColor: "transparent",
    textStyle: baseTextStyle(theme),
    animationDuration: 700,
    animationDurationUpdate: 450,
    animationEasingUpdate: "cubicInOut",
    grid: gridWithLabels({ left: 4, right: 12, top: 44, bottom: showSlider ? 52 : 8 }),
    legend: { ...baseLegend(theme), left: 0, top: 0, right: 140 },
    toolbox: baseToolbox(theme, "cts-request-trends", {
      magicType: { type: ["line", "bar"], title: { line: "Line", bar: "Bar" } },
    }),
    tooltip: {
      ...baseTooltip(theme),
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: theme.axisLine, width: 1 } },
      formatter: (params) => {
        const items = tooltipItems(params);
        const index = items[0]?.dataIndex ?? 0;
        const total = items.reduce((sum, item) => sum + numericValue(item), 0);
        const rows = items
          .map((item) =>
            tooltipRow(theme, String(item.color), item.seriesName ?? "", formatNumber(numericValue(item))),
          )
          .join("");
        const footer = items.length > 1 ? tooltipFooter(theme, "Total", formatNumber(total)) : "";
        return tooltipHeader(theme, data.tooltipLabels[index] ?? "") + rows + footer;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.axisLabels,
      ...categoryAxisStyle(theme),
      axisLabel: { ...categoryAxisStyle(theme).axisLabel, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      ...valueAxisStyle(theme),
      axisLabel: { ...valueAxisStyle(theme).axisLabel, formatter: (value: number) => formatCompact(value) },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100, zoomOnMouseWheel: "shift", moveOnMouseWheel: false },
      ...(showSlider
        ? [
            {
              type: "slider" as const,
              start: 0,
              end: 100,
              height: 18,
              bottom: 6,
              borderColor: theme.axisLine,
              backgroundColor: "transparent",
              fillerColor: withAlpha(theme.modules.tracking, 0.12),
              dataBackground: {
                lineStyle: { color: theme.axisLine },
                areaStyle: { color: withAlpha(theme.textMuted, 0.15) },
              },
              selectedDataBackground: {
                lineStyle: { color: theme.modules.tracking },
                areaStyle: { color: withAlpha(theme.modules.tracking, 0.2) },
              },
              handleStyle: { color: theme.surface, borderColor: theme.textMuted },
              moveHandleStyle: { color: theme.axisLine },
              textStyle: { color: theme.textMuted, fontSize: 10 },
            },
          ]
        : []),
    ],
    series: data.series.map((series) => {
      const color = theme.modules[series.type];
      return {
        id: series.type,
        name: MODULES[series.type].label,
        type: "line" as const,
        data: series.values,
        smooth: 0.35,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: data.axisLabels.length <= 14,
        color,
        lineStyle: { width: 2.25 },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(color, single ? 0.28 : 0.14) },
              { offset: 1, color: withAlpha(color, 0) },
            ],
          },
        },
        emphasis: { focus: "series" as const },
        markPoint: {
          symbol: "pin",
          symbolSize: 38,
          label: { color: "#ffffff", fontSize: 10, fontWeight: 600, formatter: (p: { value?: unknown }) => formatCompact(Number(p.value ?? 0)) },
          data: single
            ? [
                { type: "max" as const, name: "Peak" },
                { type: "min" as const, name: "Low" },
              ]
            : [{ type: "max" as const, name: "Peak" }],
        },
        markLine: single
          ? {
              symbol: "none",
              silent: true,
              lineStyle: { color: theme.textMuted, type: "dashed" as const, width: 1 },
              label: {
                color: theme.textMuted,
                fontSize: 10,
                position: "insideEndTop" as const,
                formatter: (p: { value?: unknown }) => `Avg ${formatNumber(Math.round(Number(p.value ?? 0)))}`,
              },
              data: [{ type: "average" as const, name: "Average" }],
            }
          : undefined,
      };
    }),
  };
}
