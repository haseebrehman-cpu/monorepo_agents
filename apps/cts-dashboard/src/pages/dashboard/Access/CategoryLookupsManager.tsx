import { useState, type FormEvent } from "react";
import { Button, Input, cn } from "@rdx/ui";
import {
  AlertCircleIcon,
  CoinsIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  PlusIcon,
  StoreIcon,
  TagIcon,
  Trash2Icon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";
import type { CategoryLookupScope, RefundLookup, RefundLookupKind } from "../../../lib/admin-api";
import {
  useCategoryLookups,
  useCreateCategoryLookup,
  useDeleteCategoryLookup,
  useUpdateCategoryLookup,
} from "../../../lib/use-admin";

const SCOPE_LABEL: Record<CategoryLookupScope, string> = {
  refund: "refund",
  resend: "resend",
};

const GROUPS: {
  kind: RefundLookupKind;
  title: string;
  singular: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    kind: "type",
    title: "Types",
    singular: "type",
    icon: TagIcon,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    kind: "sales_channel",
    title: "Sales channels",
    singular: "channel",
    icon: StoreIcon,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    kind: "currency",
    title: "Refund currencies",
    singular: "currency",
    icon: CoinsIcon,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    kind: "reason",
    title: "Reasons",
    singular: "reason",
    icon: AlertCircleIcon,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    kind: "tag",
    title: "Tags",
    singular: "tag",
    icon: TagIcon,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    kind: "accountable",
    title: "Accountable",
    singular: "department",
    icon: UserRoundIcon,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

function LookupColumn({
  scope,
  kind,
  title,
  singular,
  items,
  icon: Icon,
  iconBg,
  iconColor,
}: (typeof GROUPS)[number] & { scope: CategoryLookupScope; items: RefundLookup[] }) {
  const createLookup = useCreateCategoryLookup(scope);
  const updateLookup = useUpdateCategoryLookup(scope);
  const deleteLookup = useDeleteCategoryLookup(scope);
  const [label, setLabel] = useState("");

  const onAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = label.trim();
    if (!value) return;
    createLookup.mutate(
      { kind, label: value },
      { onSuccess: () => setLabel("") },
    );
  };

  return (
    <div className="flex max-h-[700px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBg, iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {title}
              <span className="ml-1.5 text-xs font-normal text-slate-400">({items.length})</span>
            </h2>
            <p className="text-xs text-slate-500">Shown on the {SCOPE_LABEL[scope]} form</p>
          </div>
        </div>
      </div>

      <form onSubmit={onAdd} className="flex gap-2 border-b border-slate-100 px-5 py-3">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder={`Add ${singular}`}
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={createLookup.isPending} className="shrink-0">
          {createLookup.isPending ? (
            <LoaderCircleIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
        </Button>
      </form>

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
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    item.isActive ? "text-slate-800" : "text-slate-400 line-through",
                  )}
                >
                  {item.label}
                </p>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    title={item.isActive ? "Hide from dropdown" : "Show in dropdown"}
                    disabled={updateLookup.isPending}
                    onClick={() => updateLookup.mutate({ id: item.id, isActive: !item.isActive })}
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                  >
                    {item.isActive ? <EyeIcon className="h-3.5 w-3.5" /> : <EyeOffIcon className="h-3.5 w-3.5" />}
                  </button>
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

export default function CategoryLookupsManager({ scope }: { scope: CategoryLookupScope }) {
  const lookups = useCategoryLookups(scope);
  const scopeLabel = SCOPE_LABEL[scope];
  const groups = GROUPS.filter((group) => scope === "refund" || group.kind !== "currency");

  if (lookups.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        Loading {scopeLabel} options...
      </div>
    );
  }

  if (lookups.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
        Could not load {scopeLabel} options.
      </div>
    );
  }

  const items = lookups.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        These values fill the {scopeLabel} form dropdowns. Country lists every country, and Item Returned is True or False.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <LookupColumn
            key={`${scope}-${group.kind}`}
            scope={scope}
            {...group}
            items={items.filter((item) => item.kind === group.kind)}
          />
        ))}
      </div>
    </div>
  );
}
