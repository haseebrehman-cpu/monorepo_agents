import type { TooltipComponentFormatterCallbackParams } from "echarts";

export type TooltipItem = Exclude<TooltipComponentFormatterCallbackParams, unknown[]>;

export function tooltipItems(params: TooltipComponentFormatterCallbackParams): TooltipItem[] {
  return Array.isArray(params) ? params : [params];
}

export function numericValue(item: TooltipItem): number {
  return typeof item.value === "number" ? item.value : Number(item.value ?? 0);
}
