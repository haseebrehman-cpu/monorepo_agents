import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Filters from "../../organisms/TrackingFilters/Filters";
import { Button, Input } from "@rdx/ui";
import { FilterIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "react-toastify";
import type { RefundListFilters, RefundOptions } from "../../../lib/refunds-api";
import type { ResendOptions } from "../../../lib/resends-api";
import { useRefundOptions } from "../../../lib/use-refunds";
import { useResendOptions } from "../../../lib/use-resends";
import type { CategoryTicketKind } from "../CategoryTicketForm";

type FilterId =
  | "type"
  | "salesChannel"
  | "refundCurrency"
  | "country"
  | "courierService"
  | "reason"
  | "tags"
  | "accountable"
  | "itemReturned";

type FilterField = {
  id: FilterId;
  label: string;
  placeholder: string;
};

const FILTER_FIELDS: FilterField[] = [
  { id: "type", label: "Type", placeholder: "--Select Type--" },
  { id: "salesChannel", label: "Sales Channel", placeholder: "Select Sale Channel" },
  { id: "refundCurrency", label: "Refund Currency", placeholder: "Select Currency" },
  { id: "country", label: "Country", placeholder: "Select Country" },
  { id: "courierService", label: "Courier Service", placeholder: "Courier Service" },
  { id: "reason", label: "Reason", placeholder: "--Select Reason--" },
  { id: "tags", label: "Tags", placeholder: "--Select Tag--" },
  { id: "accountable", label: "Accountable", placeholder: "--Select Department--" },
  { id: "itemReturned", label: "Item Returned", placeholder: "-- Select --" },
];

function filterOptions(id: FilterId, options: RefundOptions | ResendOptions | undefined) {
  if (!options) return [];
  if (id === "type") return options.types;
  if (id === "salesChannel") return options.salesChannels;
  if (id === "refundCurrency") return "currencies" in options ? options.currencies : [];
  if (id === "country") return options.countries;
  if (id === "reason") return options.reasons;
  if (id === "tags") return options.tags;
  if (id === "accountable") return options.accountables;
  if (id === "itemReturned") return options.itemReturned;
  return [];
}

const EMPTY_FILTERS: Record<FilterId, string> = {
  type: "",
  salesChannel: "",
  refundCurrency: "",
  country: "",
  courierService: "",
  reason: "",
  tags: "",
  accountable: "",
  itemReturned: "",
};

type CategoryTicketFilterPaneProps = {
  kind: Extract<CategoryTicketKind, "refund" | "resend">;
  onApply?: (filters: RefundListFilters) => void;
  onReset?: () => void;
};

const CategoryTicketFilterPane = ({ kind, onApply, onReset }: CategoryTicketFilterPaneProps) => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const refundOptions = useRefundOptions(kind === "refund");
  const resendOptions = useResendOptions(kind === "resend");
  const options = kind === "refund" ? refundOptions.data : resendOptions.data;
  const fields = useMemo(
    () => FILTER_FIELDS.filter((field) => kind === "refund" || field.id !== "refundCurrency"),
    [kind],
  );

  const handleApply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply?.(filters);
    toast.success("Filters applied successfully");
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    onReset?.();
    toast.success("Filters reset successfully");
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleApply}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => {
            const isCourierText = field.id === "courierService";

            return (
              <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={field.id} className="text-sm font-medium text-slate-700">
                  {field.label}:
                </label>
                {isCourierText ? (
                  <Input
                    id={field.id}
                    value={filters.courierService}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setFilters((prev) => ({ ...prev, courierService: event.target.value }))
                    }
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Filters
                    id={field.id}
                    value={filters[field.id]}
                    onChange={(next) => setFilters((prev) => ({ ...prev, [field.id]: next }))}
                    options={filterOptions(field.id, options)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            );
          })}
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

export default CategoryTicketFilterPane;
