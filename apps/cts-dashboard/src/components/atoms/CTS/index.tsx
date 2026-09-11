import { useState, type ChangeEvent, type FormEvent } from "react";
import Filters from "../../organisms/HomeReportFilters/Filters";
import { Button } from "@rdx/ui";
import { FilterIcon } from "lucide-react";
import { RotateCcwIcon } from "lucide-react";

const EMPTY_FILTERS = {
  courier: "",
  issue: "",
  assignedTo: "",
  createdBy: "",
  status: "",
  fromDate: "",
  toDate: "",
  modifiedBy: "",
};

type FilterValues = typeof EMPTY_FILTERS;
type SelectFilterId = Exclude<keyof FilterValues, "fromDate" | "toDate">;

const SELECT_FIELDS: Array<{
  id: SelectFilterId;
  label: string;
  options: string[];
}> = [
    { id: "courier", label: "Courier", options: ["DHL", "FedEx", "UPS", "Aramex"] },
    { id: "issue", label: "Issue", options: ["Delayed", "Lost", "Damaged", "Wrong address"] },
    { id: "assignedTo", label: "Assigned to", options: ["Unassigned", "Agent A", "Agent B"] },
    { id: "createdBy", label: "Created by", options: ["System", "Agent A", "Agent B"] },
    { id: "status", label: "Status", options: ["Open", "In progress", "Resolved", "Closed"] },
  ];

const DATE_INPUT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-slate-900 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const Dashboard_Home_Filters_Pane = () => {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  const setSelect = (id: SelectFilterId) => (next: string | null) => {
    setFilters((prev) => ({ ...prev, [id]: next ?? "" }));
  };

  const setDate =
    (id: "fromDate" | "toDate") => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [id]: event.target.value }));
    };

  const onApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const onReset = () => {
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={onApply}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SELECT_FIELDS.map((field) => (
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
              Modified by
            </label>
            <Filters
              id="modifiedBy"
              value={filters.modifiedBy}
              onChange={setSelect("modifiedBy")}
              options={["System", "Agent A", "Agent B"]}
              placeholder="Select modified by"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button size="sm" type="button" variant="outline" onClick={onReset}>
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

export default Dashboard_Home_Filters_Pane;
