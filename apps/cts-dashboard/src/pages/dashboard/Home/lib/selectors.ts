import { ACTIVITY_TITLES, MODULES, REQUEST_STATUSES, REQUEST_TYPES } from "../constants";
import type {
  ActivityItem,
  ComparisonDatum,
  CustomDateRange,
  DashboardFilters,
  DateRange,
  DateRangePreset,
  DistributionDatum,
  KpiSummary,
  PeriodRange,
  RequestRecord,
  RequestStatus,
  RequestType,
  StatusMatrix,
  TrendDataset,
  TrendGranularity,
} from "../types";
import {
  addDays,
  addHours,
  addMonths,
  parseDateInput,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
} from "./date";
import { formatRange, formatShortDate, formatTime, formatWeekRange } from "./format";

const LAST_N_DAYS: Partial<Record<DateRangePreset, number>> = {
  last7: 7,
  last30: 30,
  last90: 90,
};

function previousOf(current: DateRange): DateRange {
  const length = current.end.getTime() - current.start.getTime();
  return { start: new Date(current.start.getTime() - length), end: current.start };
}

/** Resolves the selected preset into the current period and an equally long previous period. */
export function resolvePeriod(
  preset: DateRangePreset,
  customRange: CustomDateRange,
  now: Date,
): PeriodRange {
  const today = startOfDay(now);

  if (preset === "today") {
    const current = { start: today, end: now };
    return { current, previous: { start: addDays(today, -1), end: addDays(now, -1) } };
  }
  if (preset === "yesterday") {
    const current = { start: addDays(today, -1), end: today };
    return { current, previous: { start: addDays(today, -2), end: addDays(today, -1) } };
  }
  if (preset === "custom") {
    const from = parseDateInput(customRange.from);
    const to = parseDateInput(customRange.to);
    if (from && to) {
      const [first, last] = from <= to ? [from, to] : [to, from];
      const end = new Date(Math.min(addDays(last, 1).getTime(), now.getTime()));
      const start = first < end ? first : startOfDay(end);
      const current = { start, end };
      return { current, previous: previousOf(current) };
    }
  }

  const days = LAST_N_DAYS[preset] ?? 30;
  const current = { start: addDays(today, -(days - 1)), end: now };
  return { current, previous: { start: addDays(current.start, -days), end: current.start } };
}

export function isInRange(date: Date, range: DateRange): boolean {
  const time = date.getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

interface RecordQuery {
  range: DateRange;
  status: DashboardFilters["status"];
  requestType?: DashboardFilters["requestType"];
}

/** Records are sorted by `createdAt`, so the scan can stop at the end of the range. */
export function selectRecords(records: readonly RequestRecord[], query: RecordQuery): RequestRecord[] {
  const end = query.range.end.getTime();
  const result: RequestRecord[] = [];
  for (const record of records) {
    if (record.createdAt.getTime() >= end) break;
    if (!isInRange(record.createdAt, query.range)) continue;
    if (query.status !== "all" && record.status !== query.status) continue;
    if (query.requestType && query.requestType !== "all" && record.type !== query.requestType) continue;
    result.push(record);
  }
  return result;
}

export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function countByType(records: readonly RequestRecord[]): Record<RequestType, number> {
  const counts: Record<RequestType, number> = { tracking: 0, refund: 0, return: 0, resend: 0 };
  for (const record of records) counts[record.type] += 1;
  return counts;
}

export function buildStatusMatrix(records: readonly RequestRecord[]): StatusMatrix {
  const empty = (): Record<RequestStatus, number> => ({
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    failed: 0,
  });
  const matrix: StatusMatrix = { tracking: empty(), refund: empty(), return: empty(), resend: empty() };
  for (const record of records) matrix[record.type][record.status] += 1;
  return matrix;
}

export function buildKpis(
  current: readonly RequestRecord[],
  previous: readonly RequestRecord[],
): KpiSummary[] {
  const matrix = buildStatusMatrix(current);
  const previousCounts = countByType(previous);

  return REQUEST_TYPES.map((type) => {
    const meta = MODULES[type];
    const counts = matrix[type];
    const total = REQUEST_STATUSES.reduce((sum, status) => sum + counts[status], 0);
    const settled = counts.completed + counts.rejected + counts.failed;
    return {
      type,
      total,
      previousTotal: previousCounts[type],
      changePct: changePercent(total, previousCounts[type]),
      resolutionRate: total === 0 ? 0 : settled / total,
      breakdown: meta.statuses.map((status) => ({
        status,
        label: meta.stageLabels[status] ?? status,
        count: counts[status],
        share: total === 0 ? 0 : counts[status] / total,
      })),
    };
  });
}

function bucketStart(date: Date, granularity: TrendGranularity): Date {
  if (granularity === "hourly") return startOfHour(date);
  if (granularity === "daily") return startOfDay(date);
  if (granularity === "weekly") return startOfWeek(date);
  return startOfMonth(date);
}

function nextBucket(date: Date, granularity: TrendGranularity): Date {
  if (granularity === "hourly") return addHours(date, 1);
  if (granularity === "daily") return addDays(date, 1);
  if (granularity === "weekly") return addDays(date, 7);
  return addMonths(date, 1);
}

function bucketStarts(range: DateRange, granularity: TrendGranularity): Date[] {
  const starts: Date[] = [];
  for (
    let cursor = bucketStart(range.start, granularity);
    cursor < range.end;
    cursor = nextBucket(cursor, granularity)
  ) {
    starts.push(cursor);
  }
  return starts;
}

/** A granularity is only useful when it yields at least two points; daily is the fallback. */
export function availableGranularities(range: DateRange): TrendGranularity[] {
  const spanHours = (range.end.getTime() - range.start.getTime()) / (60 * 60 * 1000);
  const options: TrendGranularity[] = [];
  if (spanHours <= 72) options.push("hourly");
  for (const granularity of ["daily", "weekly", "monthly"] as const) {
    if (bucketStarts(range, granularity).length >= 2) options.push(granularity);
  }
  return options.length > 0 ? options : ["daily"];
}

function axisLabel(start: Date, granularity: TrendGranularity): string {
  if (granularity === "hourly") return formatTime(start);
  if (granularity === "monthly") return start.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return formatShortDate(start);
}

function tooltipLabel(start: Date, granularity: TrendGranularity): string {
  if (granularity === "hourly") {
    return `${formatShortDate(start)}, ${formatTime(start)} – ${formatTime(addHours(start, 1))}`;
  }
  if (granularity === "daily") {
    return start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  if (granularity === "weekly") return `Week of ${formatWeekRange(start)}`;
  return start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function buildTrend(
  records: readonly RequestRecord[],
  range: DateRange,
  granularity: TrendGranularity,
  types: readonly RequestType[],
): TrendDataset {
  const starts = bucketStarts(range, granularity);
  const startTimes = starts.map((start) => start.getTime());
  const values: Record<RequestType, number[]> = {
    tracking: starts.map(() => 0),
    refund: starts.map(() => 0),
    return: starts.map(() => 0),
    resend: starts.map(() => 0),
  };

  let bucket = 0;
  for (const record of records) {
    const time = record.createdAt.getTime();
    while (bucket + 1 < startTimes.length && time >= startTimes[bucket + 1]) bucket += 1;
    if (time >= startTimes[bucket]) values[record.type][bucket] += 1;
  }

  return {
    granularity,
    axisLabels: starts.map((start) => axisLabel(start, granularity)),
    tooltipLabels: starts.map((start) => tooltipLabel(start, granularity)),
    series: types.map((type) => ({ type, values: values[type] })),
  };
}

export function buildDistribution(
  records: readonly RequestRecord[],
  types: readonly RequestType[],
): DistributionDatum[] {
  const counts = countByType(records);
  return types.map((type) => ({ type, count: counts[type] }));
}

export function buildComparison(
  current: readonly RequestRecord[],
  previous: readonly RequestRecord[],
  types: readonly RequestType[],
): ComparisonDatum[] {
  const currentCounts = countByType(current);
  const previousCounts = countByType(previous);
  return types.map((type) => ({
    type,
    current: currentCounts[type],
    previous: previousCounts[type],
    changePct: changePercent(currentCounts[type], previousCounts[type]),
  }));
}

export function buildActivities(records: readonly RequestRecord[], limit: number): ActivityItem[] {
  return [...records]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
    .map((record) => ({
      id: `${record.id}-${record.status}`,
      record,
      title: ACTIVITY_TITLES[record.type][record.status] ?? `${MODULES[record.type].label} updated`,
      at: record.updatedAt,
    }));
}

export function stageLabel(type: RequestType, status: RequestStatus): string {
  return MODULES[type].stageLabels[status] ?? status;
}

export function describePeriod(period: PeriodRange): { current: string; previous: string } {
  return { current: formatRange(period.current), previous: formatRange(period.previous) };
}
