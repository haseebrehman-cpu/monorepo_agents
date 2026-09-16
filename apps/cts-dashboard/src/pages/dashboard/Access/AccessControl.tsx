import { useState } from "react";
import { cn } from "@rdx/ui";
import { RequireSuperAdmin } from "../../../routes/guards";
import UsersManager from "./UsersManager";
import UserAccessManager from "./UserAccessManager";

type Tab = "users" | "access";

function AccessControl() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Access control</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create admins and users, then assign the features each person can use. Only the super admin can open this page.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            tab === "users"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
          )}
        >
          Users
        </button>
        <button
          type="button"
          onClick={() => setTab("access")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            tab === "access"
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
          )}
        >
          User access
        </button>
      </div>

      {tab === "users" ? <UsersManager /> : <UserAccessManager />}
    </div>
  );
}

export default function AccessControlPage() {
  return (
    <RequireSuperAdmin>
      <AccessControl />
    </RequireSuperAdmin>
  );
}
