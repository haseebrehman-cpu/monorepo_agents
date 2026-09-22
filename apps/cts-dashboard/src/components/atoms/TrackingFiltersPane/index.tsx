import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Filters from "../../organisms/TrackingFilters/Filters";
import { Button } from "@rdx/ui";
import { FilterIcon } from "lucide-react";
import { RotateCcwIcon } from "lucide-react";
import { toast } from "react-toastify";
import { useTicketOptions } from "../../../lib/use-tickets";
import {
  EMPTY_TICKET_FILTERS,
  type TicketListFilters,
} from "../../../lib/tickets-api";

type SelectFilterId = Exclude<keyof TicketListFilters, "fromDate" | "toDate">;

type TrackingFilterPaneProps = {
  onApply: (filters: TicketListFilters) => void;
  onReset: () => void;
};

const DATE_INPUT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-slate-900 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const Tracking_Filter_Pane = ({ onApply, onReset }: TrackingFilterPaneProps) => {
  const [filters, setFilters] = useState<TicketListFilters>(EMPTY_TICKET_FILTERS);
  const optionsQuery = useTicketOptions();

  const selectFields = useMemo<
    Array<{ id: SelectFilterId; label: string; options: string[] }>
  >(() => {
    const options = optionsQuery.data;
    const departmentNames = (options?.departments ?? []).map((department) => department.name);
    const userNames = (options?.users ?? []).map((user) => user.name);

    return [
      { id: "courier", label: "Courier", options: options?.couriers ?? [] },
      { id: "issue", label: "Issue", options: options?.issues ?? [] },
      { id: "assignedTo", label: "Assigned to", options: ["Unassigned", ...departmentNames] },
      { id: "createdBy", label: "Created by", options: userNames },
      { id: "status", label: "Status", options: options?.statuses ?? [] },
      { id: "modifiedBy", label: "Modified by", options: userNames },
    ];
  }, [optionsQuery.data]);

  const modifiedByField = selectFields[selectFields.length - 1];
  const gridFields = selectFields.slice(0, -1);

  const setSelect = (id: SelectFilterId) => (next: string | null) => {
    setFilters((prev) => ({ ...prev, [id]: next ?? "" }));
  };

  const setDate =
    (id: "fromDate" | "toDate") => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [id]: event.target.value }));
    };

  const handleApply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onApply(filters);
    toast.success("Filters applied successfully");
  };

  const handleReset = () => {
    setFilters(EMPTY_TICKET_FILTERS);
    onReset();
    toast.success("Filters reset successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleApply}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gridFields.map((field) => (
            <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <Filters
                id={field.id}
                value={filters[field.id]}
                onChange={setSelect(field.id)}
                options={field.options}
                placeholder={`Select ${field.label.toLowerCase()}`}
              />
            </div>
          ))}

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="fromDate" className="text-sm font-medium text-slate-700">
              From date
            </label>
            <input
              id="fromDate"
              type="date"
              value={filters.fromDate}
              max={filters.toDate || undefined}
              onChange={setDate("fromDate")}
              className={DATE_INPUT_CLASS}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="toDate" className="text-sm font-medium text-slate-700">
              To date
            </label>
            <input
              id="toDate"
              type="date"
              value={filters.toDate}
              min={filters.fromDate || undefined}
              onChange={setDate("toDate")}
              className={DATE_INPUT_CLASS}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="modifiedBy" className="text-sm font-medium text-slate-700">
              {modifiedByField.label}
            </label>
            <Filters
              id={modifiedByField.id}
              value={filters.modifiedBy}
              onChange={setSelect("modifiedBy")}
              options={modifiedByField.options}
              placeholder={`Select ${modifiedByField.label.toLowerCase()}`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button size="sm" type="button" variant="outline" onClick={handleReset}>
            <RotateCcwIcon className="h-4 w-4" />
            Reset Filters
          </Button>
          <Button size="sm" type="submit" variant="primary">
            <FilterIcon className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Tracking_Filter_Pane;
