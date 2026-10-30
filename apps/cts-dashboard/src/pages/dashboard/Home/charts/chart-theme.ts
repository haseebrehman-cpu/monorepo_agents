import type { RequestStatus, RequestType, ThemeMode } from "../types";
import type { LegendOption, ToolboxOption, TooltipOption } from "./echarts";

/**
 * Canvas rendering cannot read CSS variables, so these mirror the UI kit tokens
 * (`--card`, `--foreground`, `--muted-foreground`, `--border`) and Tailwind's palette.
 */
export interface ChartTheme {
  mode: ThemeMode;
  surface: string;
  text: string;
  textMuted: string;
  axisLine: string;
  splitLine: string;
  tooltip: { background: string; border: string; text: string; muted: string; shadow: string };
  modules: Record<RequestType, string>;
  statuses: Record<RequestStatus, string>;
  positive: string;
  negative: string;
  previous: string;
  current: string;
}

const LIGHT: ChartTheme = {
  mode: "light",
  surface: "#ffffff",
  text: "#171717",
  textMuted: "#737373",
  axisLine: "#e5e5e5",
  splitLine: "#f0f0f0",
  tooltip: {
    background: "#ffffff",
    border: "#e5e5e5",
    text: "#171717",
    muted: "#737373",
    shadow: "0 8px 24px rgb(15 23 42 / 0.12)",
  },
  modules: { tracking: "#2563eb", refund: "#7c3aed", return: "#f97316", resend: "#0d9488" },
  statuses: {
    pending: "#f59e0b",
    processing: "#0ea5e9",
    completed: "#10b981",
    rejected: "#ef4444",
    failed: "#9f1239",
  },
  positive: "#059669",
  negative: "#dc2626",
  previous: "#d4d4d4",
  current: "#404040",
};

const DARK: ChartTheme = {
  mode: "dark",
  surface: "#171717",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  axisLine: "#404040",
  splitLine: "#262626",
  tooltip: {
    background: "#262626",
    border: "#404040",
    text: "#fafafa",
    muted: "#a3a3a3",
    shadow: "0 8px 24px rgb(0 0 0 / 0.45)",
  },
  modules: { tracking: "#60a5fa", refund: "#a78bfa", return: "#fb923c", resend: "#2dd4bf" },
  statuses: {
    pending: "#fbbf24",
    processing: "#38bdf8",
    completed: "#34d399",
    rejected: "#f87171",
    failed: "#e11d48",
  },
  positive: "#34d399",
  negative: "#f87171",
  previous: "#525252",
  current: "#d4d4d4",
};

export function getChartTheme(mode: ThemeMode): ChartTheme {
  return mode === "dark" ? DARK : LIGHT;
}

/** Appends an alpha channel to a `#rrggbb` color. */
export function withAlpha(hex: string, alpha: number): string {
  const channel = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${channel}`;
}

export const CHART_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export function baseTextStyle(theme: ChartTheme) {
  return { fontFamily: CHART_FONT, color: theme.text };
}

export function baseTooltip(theme: ChartTheme): TooltipOption {
  return {
    confine: true,
    backgroundColor: theme.tooltip.background,
    borderColor: theme.tooltip.border,
    borderWidth: 1,
    padding: [10, 12],
    textStyle: { color: theme.tooltip.text, fontFamily: CHART_FONT, fontSize: 12 },
    extraCssText: `border-radius: 10px; box-shadow: ${theme.tooltip.shadow};`,
  };
}

export function baseLegend(theme: ChartTheme): LegendOption {
  return {
    type: "scroll",
    icon: "roundRect",
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 16,
    textStyle: { color: theme.textMuted, fontFamily: CHART_FONT, fontSize: 12 },
    inactiveColor: theme.axisLine,
    pageIconColor: theme.textMuted,
    pageIconInactiveColor: theme.axisLine,
    pageTextStyle: { color: theme.textMuted },
  };
}

export function baseToolbox(
  theme: ChartTheme,
  fileName: string,
  extraFeatures: ToolboxOption["feature"] = {},
): ToolboxOption {
  return {
    right: 0,
    top: 0,
    itemSize: 14,
    itemGap: 10,
    iconStyle: { borderColor: theme.textMuted },
    emphasis: { iconStyle: { borderColor: theme.text } },
    feature: {
      ...extraFeatures,
      dataView: {
        title: "Data view",
        readOnly: true,
        lang: ["Data view", "Close", "Refresh"],
        backgroundColor: theme.surface,
        textareaColor: theme.surface,
        textareaBorderColor: theme.axisLine,
        textColor: theme.text,
        buttonColor: theme.modules.tracking,
        buttonTextColor: "#ffffff",
      },
      restore: { title: "Restore" },
      saveAsImage: {
        title: "Save as image",
        name: fileName,
        pixelRatio: 2,
        backgroundColor: theme.surface,
      },
    },
  };
}

/** Grid that keeps axis labels inside the chart box (ECharts 6 replacement for `containLabel`). */
export function gridWithLabels(bounds: { left: number; right: number; top: number; bottom: number }) {
  return { ...bounds, outerBoundsMode: "same" as const, outerBoundsContain: "axisLabel" as const };
}

export function categoryAxisStyle(theme: ChartTheme) {
  return {
    axisLine: { lineStyle: { color: theme.axisLine } },
    axisTick: { show: false },
    axisLabel: { color: theme.textMuted, fontFamily: CHART_FONT, fontSize: 11 },
  };
}

export function valueAxisStyle(theme: ChartTheme) {
  return {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: theme.textMuted, fontFamily: CHART_FONT, fontSize: 11 },
    splitLine: { lineStyle: { color: theme.splitLine, type: "dashed" as const } },
  };
}

/** One row of an HTML tooltip: colored marker, label, right-aligned value. */
export function tooltipRow(
  theme: ChartTheme,
  color: string,
  label: string,
  value: string,
  detail?: string,
): string {
  const detailHtml = detail
    ? `<span style="color:${theme.tooltip.muted};margin-left:6px;font-weight:400">${detail}</span>`
    : "";
  return `<div style="display:flex;align-items:center;gap:8px;line-height:20px">
    <span style="width:8px;height:8px;border-radius:2px;background:${color};flex:none"></span>
    <span style="color:${theme.tooltip.muted};flex:1">${label}</span>
    <span style="font-weight:600;margin-left:16px">${value}${detailHtml}</span>
  </div>`;
}

export function tooltipHeader(theme: ChartTheme, title: string): string {
  return `<div style="font-weight:600;margin-bottom:6px;color:${theme.tooltip.text}">${title}</div>`;
}

export function tooltipFooter(theme: ChartTheme, label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;padding-top:6px;border-top:1px solid ${theme.tooltip.border}">
    <span style="color:${theme.tooltip.muted}">${label}</span><span style="font-weight:600">${value}</span>
  </div>`;
}
