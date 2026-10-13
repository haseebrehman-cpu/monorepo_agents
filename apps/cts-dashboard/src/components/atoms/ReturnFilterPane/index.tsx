import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, DropDown, Input } from "@rdx/ui";
import { FilterIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "react-toastify";

type ReturnSelectId =
  | "category"
  | "lossNoLoss"
  | "type"
  | "saleChannel"
  | "country"
  | "accountable"
  | "reason"
  | "courier"
  | "productCategory"
  | "status";

type ReturnFilters = Record<ReturnSelectId, string> & {
  fromDate: string;
  toDate: string;
};

type ReturnField =
  | { kind: "select"; id: ReturnSelectId; label: string; placeholder: string }
  | { kind: "date"; id: "fromDate" | "toDate"; label: string };

const EMPTY_RETURN_FILTERS: ReturnFilters = {
  category: "",
  lossNoLoss: "",
  type: "",
  saleChannel: "",
  country: "",
  accountable: "",
  reason: "",
  courier: "",
  productCategory: "",
  status: "",
  fromDate: "",
  toDate: "",
};

const RETURN_FIELDS: ReturnField[] = [
  { kind: "select", id: "category", label: "Category", placeholder: "All Category" },
  { kind: "select", id: "lossNoLoss", label: "Loss/No Loss", placeholder: "-- Select --" },
  { kind: "select", id: "type", label: "Type", placeholder: "All Type" },
  { kind: "date", id: "fromDate", label: "From" },
  { kind: "select", id: "saleChannel", label: "Sale Channel", placeholder: "Select Sale Channel" },
  { kind: "select", id: "country", label: "Country", placeholder: "Select Country" },
  { kind: "select", id: "accountable", label: "Accountable", placeholder: "All Departments" },
  { kind: "date", id: "toDate", label: "To" },
  { kind: "select", id: "reason", label: "Reason", placeholder: "--Select Reason--" },
  { kind: "select", id: "courier", label: "Courier", placeholder: "All Courier" },
  {
    kind: "select",
    id: "productCategory",
    label: "Product Category",
    placeholder: "Select Category Name",
  },
  { kind: "select", id: "status", label: "Status", placeholder: "Select Status" },
];

const ReturnFilterPane = () => {
  const [filters, setFilters] = useState<ReturnFilters>(EMPTY_RETURN_FILTERS);

  const setSelect = (id: ReturnSelectId) => (next: string) => {
    setFilters((prev) => ({ ...prev, [id]: next }));
  };

  const setDate =
    (id: "fromDate" | "toDate") => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [id]: event.target.value }));
    };

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.success("Filters applied successfully");
  };

  const handleReset = () => {
    setFilters(EMPTY_RETURN_FILTERS);
    toast.success("Filters reset successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleApply}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {RETURN_FIELDS.map((field) =>
            field.kind === "date" ? (
              <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                  {field.label}:
                </label>
                <Input
                  id={field.id}
                  type="date"
                  value={filters[field.id]}
                  max={field.id === "fromDate" ? filters.toDate || undefined : undefined}
                  min={field.id === "toDate" ? filters.fromDate || undefined : undefined}
                  onChange={setDate(field.id)}
                />
              </div>
            ) : (
              <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                  {field.label}:
                </label>
                <DropDown
                  id={field.id}
                  value={filters[field.id] || null}
                  onChange={(next) => setSelect(field.id)(next ?? "")}
                  options={[]}
                  label={field.placeholder}
                  className="w-full"
                />
              </div>
            ),
          )}
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

export default ReturnFilterPane;
