import { useState, type FormEvent } from "react";
import { Button, Input, cn } from "@rdx/ui";
import {
  LoaderCircleIcon,
  Building2Icon,
  TruckIcon,
  AlertCircleIcon,
  CircleDotIcon,
  PlusIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  UnlockIcon,
} from "lucide-react";
import type { TicketLookup, TicketLookupKind } from "../../../lib/admin-api";
import {
  useAdminDepartments,
  useCreateDepartment,
  useCreateTicketLookup,
  useDeleteDepartment,
  useDeleteTicketLookup,
  useTicketLookups,
  useUpdateTicketLookup,
} from "../../../lib/use-admin";

/* ─────────────────────────────────────────────
   Shared Toggle
───────────────────────────────────────────── */
function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        checked ? "bg-indigo-600" : "bg-slate-200",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────
   Departments
───────────────────────────────────────────── */
function DepartmentsManager() {
  const departments = useAdminDepartments();
  const createDepartment = useCreateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const [name, setName] = useState("");

  const onAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) return;
    createDepartment.mutate(
      { name: value },
      { onSuccess: () => setName("") },
    );
  };

  if (departments.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        Loading departments...
      </div>
    );
  }

  if (departments.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-600">
        Could not load departments.
      </div>
    );
  }

  const items = departments.data ?? [];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Building2Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Departments
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                ({items.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Used in ticket assignment & user creation
            </p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={onAdd} className="flex gap-2 border-b border-slate-100 px-5 py-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New department name"
          required
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={createDepartment.isPending}
          className="shrink-0"
        >
          {createDepartment.isPending ? (
            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
            <Building2Icon className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No departments yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80"
              >
                <p className="truncate text-sm font-medium text-slate-800">
                  {item.name}
                </p>
                <button
                  type="button"
                  disabled={deleteDepartment.isPending}
                  onClick={() => deleteDepartment.mutate(item.id)}
                  className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Delete department"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const GROUPS: {
  kind: TicketLookupKind;
  title: string;
  singular: string;
  hint: string;
  icon: typeof TruckIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    kind: "courier",
    title: "Couriers",
    singular: "courier",
    hint: "Shown when adding a ticket",
    icon: TruckIcon,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    kind: "issue",
    title: "Issues",
    singular: "issue",
    hint: "Shown when adding a ticket",
    icon: AlertCircleIcon,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    kind: "status",
    title: "Statuses",
    singular: "status",
    hint: "Closed statuses stamp closed-by / closed-at",
    icon: CircleDotIcon,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

function LookupColumn({
  kind,
  title,
  singular,
  hint,
  items,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  kind: TicketLookupKind;
  title: string;
  singular: string;
  hint: string;
  items: TicketLookup[];
  icon: typeof TruckIcon;
  iconBg: string;
  iconColor: string;
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm max-h-[700px] p-3 ">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconBg,
              iconColor,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {title}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                ({items.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={onAdd}
        className="flex flex-col gap-2.5 border-b border-slate-100 px-5 py-3"
      >
        <div className="flex gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`Add ${singular}`}
            required
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={createLookup.isPending}
            className="shrink-0"
          >
            {createLookup.isPending ? (
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {kind === "status" && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <Toggle
              checked={isClosed}
              onChange={() => setIsClosed((v) => !v)}
              label="Marks ticket as closed"
            />
            Marks ticket as closed
          </label>
        )}
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
            <Icon className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No {title.toLowerCase()} yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      item.isActive
                        ? "text-slate-800"
                        : "text-slate-400 line-through",
                    )}
                  >
                    {item.label}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {!item.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        <EyeOffIcon className="h-2.5 w-2.5" />
                        Hidden
                      </span>
                    )}
                    {kind === "status" && item.isClosed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <LockIcon className="h-2.5 w-2.5" />
                        Closes ticket
                      </span>
                    )}
                    {item.isActive &&
                      !(kind === "status" && item.isClosed) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                          Active
                        </span>
                      )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Active / Hidden toggle */}
                  <button
                    type="button"
                    title={item.isActive ? "Hide from dropdown" : "Show in dropdown"}
                    disabled={updateLookup.isPending}
                    onClick={() =>
                      updateLookup.mutate({
                        id: item.id,
                        isActive: !item.isActive,
                      })
                    }
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                  >
                    {item.isActive ? (
                      <EyeIcon className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOffIcon className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Closed toggle (status only) */}
                  {kind === "status" && (
                    <button
                      type="button"
                      title={
                        item.isClosed
                          ? "Don't close tickets"
                          : "Mark as closing status"
                      }
                      disabled={updateLookup.isPending}
                      onClick={() =>
                        updateLookup.mutate({
                          id: item.id,
                          isClosed: !item.isClosed,
                        })
                      }
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                    >
                      {item.isClosed ? (
                        <LockIcon className="h-3.5 w-3.5" />
                      ) : (
                        <UnlockIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    title="Delete"
                    disabled={deleteLookup.isPending}
                    onClick={() => deleteLookup.mutate(item.id)}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TicketLookupsManager() {
  const lookups = useTicketLookups();

  if (lookups.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        Loading ticket options...
      </div>
    );
  }

  if (lookups.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
        Could not load ticket options.
      </div>
    );
  }

  const items = lookups.data ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <DepartmentsManager />
      {GROUPS.map((group) => (
        <LookupColumn
          key={group.kind}
          kind={group.kind}
          title={group.title}
          singular={group.singular}
          hint={group.hint}
          items={items.filter((item) => item.kind === group.kind)}
          icon={group.icon}
          iconBg={group.iconBg}
          iconColor={group.iconColor}
        />
      ))}
    </div>
  );
}