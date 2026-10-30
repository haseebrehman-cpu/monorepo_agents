import { useMemo } from "react";
import { ACTIVITY_FEED_LIMIT, REQUEST_TYPES } from "../constants";
import { MOCK_NOW, MOCK_REQUESTS } from "../data/mock-requests";
import {
  buildActivities,
  buildComparison,
  buildDistribution,
  buildKpis,
  buildStatusMatrix,
  resolvePeriod,
  selectRecords,
} from "../lib/selectors";
import type {
  ActivityItem,
  ComparisonDatum,
  DashboardFilters,
  DistributionDatum,
  KpiSummary,
  PeriodRange,
  RequestRecord,
  RequestType,
  StatusMatrix,
} from "../types";

export interface DashboardData {
  now: Date;
  period: PeriodRange;
  visibleTypes: readonly RequestType[];
  kpis: KpiSummary[];
  /** Current-period records matching every global filter. */
  records: RequestRecord[];
  distribution: DistributionDatum[];
  statusMatrix: StatusMatrix;
  comparison: ComparisonDatum[];
  activities: ActivityItem[];
}

export function useDashboardData(filters: DashboardFilters): DashboardData {
  const { dateRange, customRange, requestType, status } = filters;

  const period = useMemo(
    () => resolvePeriod(dateRange, customRange, MOCK_NOW),
    [dateRange, customRange],
  );

  const visibleTypes = useMemo(
    () => (requestType === "all" ? REQUEST_TYPES : [requestType]),
    [requestType],
  );

  // KPI cards always show every module, so they ignore the request type filter.
  const { start: currentStart, end: currentEnd } = period.current;
  const { start: previousStart, end: previousEnd } = period.previous;
  const scoped = useMemo(
    () => ({
      inPeriod: selectRecords(MOCK_REQUESTS, { range: { start: currentStart, end: currentEnd }, status }),
      inPreviousPeriod: selectRecords(MOCK_REQUESTS, { range: { start: previousStart, end: previousEnd }, status }),
    }),
    [currentEnd, currentStart, previousEnd, previousStart, status],
  );

  return useMemo(() => {
    const byType = (record: RequestRecord) => requestType === "all" || record.type === requestType;
    const records = scoped.inPeriod.filter(byType);
    const previous = scoped.inPreviousPeriod.filter(byType);
    return {
      now: MOCK_NOW,
      period,
      visibleTypes,
      kpis: buildKpis(scoped.inPeriod, scoped.inPreviousPeriod),
      records,
      distribution: buildDistribution(records, visibleTypes),
      statusMatrix: buildStatusMatrix(records),
      comparison: buildComparison(records, previous, visibleTypes),
      activities: buildActivities(records, ACTIVITY_FEED_LIMIT),
    };
  }, [period, requestType, scoped, visibleTypes]);
}
