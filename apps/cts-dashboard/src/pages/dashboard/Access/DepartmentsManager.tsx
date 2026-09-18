import { useState, type FormEvent } from "react";
import { Button, Input } from "@rdx/ui";
import { LoaderCircleIcon } from "lucide-react";
import {
  useAdminDepartments,
  useCreateDepartment,
  useDeleteDepartment,
} from "../../../lib/use-admin";

export default function DepartmentsManager() {
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
      {
        onSuccess: () => setName(""),
      },
    );
  };

  if (departments.isLoading) {
    return <p className="text-sm text-slate-500">Loading departments...</p>;
  }

  if (departments.isError) {
    return <p className="text-sm text-red-600">Could not load departments.</p>;
  }

  const items = departments.data ?? [];

  return (
    <div className="max-w-xl rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-1">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          Departments ({items.length})
        </h2>
        <p className="text-xs leading-relaxed text-slate-500">
          These departments appear in Assigned to when adding or replying to a ticket, and when creating users.
        </p>
      </div>

      <form onSubmit={onAdd} className="mt-5 flex items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add department"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={createDepartment.isPending}
          className="shrink-0"
        >
          {createDepartment.isPending ? (
            <LoaderCircleIcon className="mr-1.5 h-4 w-4 animate-spin" />
          ) : null}
          Add
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-slate-200 px-3.5 py-6 text-center text-xs text-slate-400">
          No departments yet.
        </p>
      ) : (
        <ul className="mt-5 flex max-h-[480px] flex-col gap-2.5 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5"
            >
              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
              <button
                type="button"
                disabled={deleteDepartment.isPending}
                onClick={() => deleteDepartment.mutate(item.id)}
                className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
