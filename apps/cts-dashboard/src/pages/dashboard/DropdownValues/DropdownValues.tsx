import { useState } from "react";
import { cn } from "@rdx/ui";
import TicketLookupsManager from "../Access/TicketLookupsManager";
import CategoryLookupsManager from "../Access/CategoryLookupsManager";

type Tab = "tracking" | "refund" | "resend";

const TABS: { id: Tab; label: string }[] = [
  { id: "tracking", label: "Tracking options" },
  { id: "refund", label: "Refund options" },
  { id: "resend", label: "Resend options" },
];

export default function DropdownValues() {
  const [tab, setTab] = useState<Tab>("tracking");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dropdown values</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add, hide, or remove the values shown in the tracking, refund, and resend form dropdowns.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium",
              tab === item.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "tracking" ? (
        <TicketLookupsManager showDepartments={false} />
      ) : (
        <CategoryLookupsManager key={tab} scope={tab} />
      )}
    </div>
  );
}
