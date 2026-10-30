import { useCallback, useMemo, useState } from "react";
import { DEFAULT_FILTERS } from "../constants";
import type { DashboardFilters } from "../types";

export interface DashboardFiltersController {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  reset: () => void;
  activeCount: number;
}

export function useDashboardFilters(): DashboardFiltersController {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) =>
      setFilters((current) => ({ ...current, [key]: value })),
    [],
  );

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeCount = useMemo(
    () =>
      [
        filters.dateRange !== DEFAULT_FILTERS.dateRange,
        filters.requestType !== DEFAULT_FILTERS.requestType,
        filters.status !== DEFAULT_FILTERS.status,
      ].filter(Boolean).length,
    [filters],
  );

  return { filters, setFilter, reset, activeCount };
}
