import { useEffect, useRef } from "react";
import type { ECharts } from "echarts/core";
import { echarts, type EChartsOption } from "./echarts";

export type EChartEventHandlers = Partial<Record<string, (params: unknown) => void>>;

interface EChartProps {
  option: EChartsOption;
  height: number;
  ariaLabel: string;
  onEvents?: EChartEventHandlers;
}

/**
 * Thin, typed wrapper around an ECharts instance. Errors thrown while
 * initialising or applying options propagate to the nearest error boundary.
 */
export default function EChart({ option, height, ariaLabel, onEvents }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const chart = echarts.init(element, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => chart.resize());
    });
    observer.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Series are replaced so removed series disappear; legend state and zoom are merged.
    chartRef.current?.setOption(option, { replaceMerge: ["series"] });
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) return;
    const entries = Object.entries(onEvents).filter(
      (entry): entry is [string, (params: unknown) => void] => typeof entry[1] === "function",
    );
    for (const [name, handler] of entries) chart.on(name, handler);
    return () => {
      for (const [name, handler] of entries) chart.off(name, handler);
    };
  }, [onEvents]);

  return <div ref={containerRef} role="img" aria-label={ariaLabel} style={{ height, width: "100%" }} />;
}
