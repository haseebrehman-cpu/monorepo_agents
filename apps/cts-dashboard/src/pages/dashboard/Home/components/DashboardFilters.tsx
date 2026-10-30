import { cn, DropDown, Input } from "@rdx/ui";
import { RotateCcw } from "lucide-react";
import { DATE_RANGE_OPTIONS, MODULES, REQUEST_STATUSES, REQUEST_TYPES, STATUSES } from "../constants";
import type { DashboardFiltersController } from "../hooks/useDashboardFilters";
import { toDateInputValue } from "../lib/date";
import { toRequestTypeFilter, toStatusFilter } from "../lib/guards";
import { SegmentedControl } from "./SegmentedControl";
import { cardClass, subtleButtonClass } from "./ui-classes";

const TYPE_OPTIONS = [
  { value: "all", label: "All request types" },
  ...REQUEST_TYPES.map((type) => ({ value: type, label: MODULES[type].label })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...REQUEST_STATUSES.map((status) => ({ value: status, label: STATUSES[status].label })),
];

interface DashboardFiltersProps {
  controller: DashboardFiltersController;
  /** Bounds for the custom range inputs. */
  minDate: Date;
  maxDate: Date;
}

export function DashboardFilters({ controller, minDate, maxDate }: DashboardFiltersProps) {
  const { filters, setFilter, reset, activeCount } = controller;
  const min = toDateInputValue(minDate);
  const max = toDateInputValue(maxDate);

  const selectPreset = (value: (typeof DATE_RANGE_OPTIONS)[number]["value"]) => {
    if (value === "custom" && !filters.customRange.from) {
      const from = new Date(maxDate);
      from.setDate(from.getDate() - 13);
      setFilter("customRange", { from: toDateInputValue(from), to: max });
    }
    setFilter("dateRange", value);
  };

  return (
    <section aria-label="Dashboard filters" className={cn(cardClass, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center")}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <SegmentedControl
          label="Date range"
          value={filters.dateRange}
          options={DATE_RANGE_OPTIONS}
          onChange={selectPreset}
        />
        {filters.dateRange === "custom" ? (
          <div className="flex items-center gap-1.5">
            <label className="sr-only" htmlFor="cts-range-from">
              From
            </label>
            <Input
              id="cts-range-from"
              type="date"
              min={min}
              max={filters.customRange.to || max}
              value={filters.customRange.from}
              onChange={(event) => setFilter("customRange", { ...filters.customRange, from: event.target.value })}
              className="h-8 w-[9.5rem] text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <label className="sr-only" htmlFor="cts-range-to">
              To
            </label>
            <Input
              id="cts-range-to"
              type="date"
              min={filters.customRange.from || min}
              max={max}
              value={filters.customRange.to}
              onChange={(event) => setFilter("customRange", { ...filters.customRange, to: event.target.value })}
              className="h-8 w-[9.5rem] text-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropDown
          id="cts-filter-type"
          label="Request type"
          options={TYPE_OPTIONS}
          value={filters.requestType}
          onChange={(value) => setFilter("requestType", toRequestTypeFilter(value))}
          className="w-full min-w-44 sm:w-44"
        />
        <DropDown
          id="cts-filter-status"
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => setFilter("status", toStatusFilter(value))}
          className="w-full min-w-36 sm:w-36"
        />
        <button type="button" onClick={reset} disabled={activeCount === 0} className={subtleButtonClass}>
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
          {activeCount > 0 ? (
            <span className="rounded-full bg-foreground px-1.5 text-[10px] leading-4 font-semibold text-background">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>
    </section>
  );
}
