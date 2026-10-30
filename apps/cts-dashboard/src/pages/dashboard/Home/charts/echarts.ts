import { BarChart, LineChart, PieChart } from "echarts/charts";
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from "echarts/charts";
import {
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";
import type {
  DataZoomComponentOption,
  GraphicComponentOption,
  GridComponentOption,
  LegendComponentOption,
  MarkLineComponentOption,
  MarkPointComponentOption,
  TitleComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption,
} from "echarts/components";
import * as echarts from "echarts/core";
import type { ComposeOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type EChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | DataZoomComponentOption
  | GraphicComponentOption
  | GridComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
>;

export type ToolboxOption = ToolboxComponentOption;
export type TooltipOption = TooltipComponentOption;
export type LegendOption = LegendComponentOption;

export { echarts };
