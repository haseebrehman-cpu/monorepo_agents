import { useState, type FormEvent } from "react";
import { Button, Input } from "@rdx/ui";
import { LoaderCircleIcon } from "lucide-react";
import type { TicketLookup, TicketLookupKind } from "../../../lib/admin-api";
import {
  useCreateTicketLookup,
  useDeleteTicketLookup,
  useTicketLookups,
  useUpdateTicketLookup,
} from "../../../lib/use-admin";

const GROUPS: {
  kind: TicketLookupKind;
  title: string;
  singular: string;
  hint: string;
}[] = [
  {
    kind: "courier",
    title: "Couriers",
    singular: "courier",
    hint: "Shown in the Courier dropdown when adding a ticket.",
  },
  {
    kind: "issue",
    title: "Issues",
    singular: "issue",
    hint: "Shown in the Issue dropdown when adding a ticket.",
  },
  {
    kind: "status",
    title: "Statuses",
    singular: "status",
    hint: "Mark a status as closed if it should stamp closed-by and closed-at.",
  },
];

function LookupColumn({
  kind,
  title,
  singular,
  hint,
  items,
}: {
  kind: TicketLookupKind;
  title: string;
  singular: string;
  hint: string;
  items: TicketLookup[];
}) {
  const createLookup = useCreateTicketLookup();
  const updateLookup = useUpdateTicketLookup();
  const deleteLookup = useDeleteTicketLookup();
  const [label, setLabel] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  const onAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = label.trim();
    if (!value) return;
    createLookup.mutate(
      { kind, label: value, isClosed: kind === "status" ? isClosed : false },
      {
        onSuccess: () => {
          setLabel("");
          setIsClosed(false);
        },
      },
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm box-shadow-md shadow-slate-200">
      <div className="mb-1">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title} ({items.length})
        </h2>
        <p className="text-xs leading-relaxed text-slate-500">{hint}</p>
      </div>

      <form onSubmit={onAdd} className="mt-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={`Add ${singular}`}
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={createLookup.isPending}
            className="shrink-0"
          >
            {createLookup.isPending ? (
              <LoaderCircleIcon className="mr-1.5 h-4 w-4 animate-spin" />
            ) : null}
            Add
          </Button>
        </div>
        {kind === "status" ? (
          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(event) => setIsClosed(event.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Marks ticket as closed
          </label>
        ) : null}
      </form>

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-slate-200 px-3.5 py-6 text-center text-xs text-slate-400">
          No {title.toLowerCase()} yet.
        </p>
      ) : (
        <ul className="mt-5 flex max-h-[400px] flex-col gap-2.5 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 transition-colors hover:border-slate-200 hover:bg-white hover:shadow-sm"
            >
              <div className="min-w-0">
                <p
                  className={
                    item.isActive
                      ? "truncate text-sm font-medium text-slate-800"
                      : "truncate text-sm text-slate-400 line-through"
                  }
                >
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {!item.isActive
                    ? "Hidden from add ticket"
                    : kind === "status" && item.isClosed
                      ? "Closes ticket"
                      : "Active"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  disabled={updateLookup.isPending}
                  onClick={() =>
                    updateLookup.mutate({ id: item.id, isActive: !item.isActive })
                  }
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {item.isActive ? "Hide" : "Show"}
                </button>

                {kind === "status" ? (
                  <button
                    type="button"
                    disabled={updateLookup.isPending}
                    onClick={() =>
                      updateLookup.mutate({
                        id: item.id,
                        isClosed: !item.isClosed,
                      })
                    }
                    className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.isClosed ? "Not closed" : "Mark closed"}
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={deleteLookup.isPending}
                  onClick={() => deleteLookup.mutate(item.id)}
                  className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TicketLookupsManager() {
  const lookups = useTicketLookups();

  if (lookups.isLoading) {
    return <p className="text-sm text-slate-500">Loading ticket options...</p>;
  }

  if (lookups.isError) {
    return (
      <p className="text-sm text-red-600">Could not load ticket options.</p>
    );
  }

  const items = lookups.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {GROUPS.map((group) => (
        <LookupColumn
          key={group.kind}
          kind={group.kind}
          title={group.title}
          singular={group.singular}
          hint={group.hint}
          items={items.filter((item) => item.kind === group.kind)}
        />
      ))}
    </div>
  );
}