import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChartTheme } from "./charts/chart-theme";
import { DashboardFilters } from "./components/DashboardFilters";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { KpiOverview } from "./components/KpiOverview";
import { RecentActivityFeed } from "./components/RecentActivityFeed";
import { RecentRequestsTable } from "./components/RecentRequestsTable";
import { RequestComparisonChart } from "./components/RequestComparisonChart";
import { RequestDetailsDialog } from "./components/RequestDetailsDialog";
import { RequestDistributionChart } from "./components/RequestDistributionChart";
import { RequestStatusChart } from "./components/RequestStatusChart";
import { RequestTrendsChart } from "./components/RequestTrendsChart";
import { MOCK_HISTORY_START } from "./data/mock-requests";
import { useDashboardData } from "./hooks/useDashboardData";
import { useDashboardFilters } from "./hooks/useDashboardFilters";
import { useSimulatedLoading } from "./hooks/useSimulatedLoading";
import { useThemeMode } from "./hooks/useThemeMode";
import { describePeriod } from "./lib/selectors";
import type { RequestRecord } from "./types";

const INITIAL_LOAD_MS = 650;

export default function HomeDashboard() {
  const navigate = useNavigate();
  const loading = useSimulatedLoading(INITIAL_LOAD_MS);
  const filtersController = useDashboardFilters();
  const data = useDashboardData(filtersController.filters);
  const theme = getChartTheme(useThemeMode());
  const periodLabels = useMemo(() => describePeriod(data.period), [data.period]);

  const [selectedRecord, setSelectedRecord] = useState<RequestRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = useCallback((record: RequestRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  }, []);

  const openModule = useCallback((route: string) => navigate(route), [navigate]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 pb-6">
      <DashboardHeader
        currentLabel={periodLabels.current}
        previousLabel={periodLabels.previous}
        updatedAt={data.now}
      />

      <DashboardFilters controller={filtersController} minDate={MOCK_HISTORY_START} maxDate={data.now} />

      <KpiOverview
        kpis={data.kpis}
        selectedType={filtersController.filters.requestType}
        previousLabel={periodLabels.previous}
        onOpenModule={openModule}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RequestTrendsChart
          className="xl:col-span-2"
          records={data.records}
          range={data.period.current}
          types={data.visibleTypes}
          theme={theme}
        />
        <RecentActivityFeed
          className="max-h-[32rem] xl:max-h-none xl:[contain:size]"
          activities={data.activities}
          now={data.now}
          onSelect={openDetails}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RequestDistributionChart data={data.distribution} theme={theme} />
        <RequestStatusChart matrix={data.statusMatrix} types={data.visibleTypes} theme={theme} />
        <RequestComparisonChart
          className="md:col-span-2 xl:col-span-1"
          data={data.comparison}
          periodLabels={periodLabels}
          theme={theme}
        />
      </div>

      <RecentRequestsTable records={data.records} now={data.now} onView={openDetails} />

      <RequestDetailsDialog
        record={selectedRecord}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onOpenModule={openModule}
      />
    </div>
  );
}
