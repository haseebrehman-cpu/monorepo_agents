import { useMemo, useState } from "react";
import { Button, cn } from "@rdx/ui";
import {
  LoaderCircleIcon,
  SearchIcon,
  ShieldIcon,
  ShieldCheckIcon,
  EyeIcon,
  UserIcon,
  SaveIcon,
} from "lucide-react";
import type { AdminUser, FeatureGroup, FeatureRef } from "../../../lib/admin-api";
import { ROLE } from "../../../lib/permissions";
import {
  useAdminFeatures,
  useAdminUsers,
  useUpdateUserPermissions,
} from "../../../lib/use-admin";

function roleCode(user: AdminUser) {
  return user.roles[0]?.code ?? "";
}

function roleName(user: AdminUser) {
  return user.roles[0]?.name ?? "No role";
}

function getRoleBadge(user: AdminUser) {
  const code = roleCode(user);
  if (code === ROLE.SUPER_ADMIN) {
    return {
      label: "Super Admin",
      className: "bg-violet-50 text-violet-700 ring-violet-200",
      icon: ShieldCheckIcon,
    };
  }
  if (code === ROLE.ADMIN) {
    return {
      label: "Admin",
      className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
      icon: ShieldIcon,
    };
  }
  if (code === ROLE.VIEWER) {
    return {
      label: "Viewer",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      icon: EyeIcon,
    };
  }
  return {
    label: roleName(user),
    className: "bg-slate-50 text-slate-600 ring-slate-200",
    icon: UserIcon,
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserAccessManager() {
  const users = useAdminUsers();
  const features = useAdminFeatures();
  const saveAccess = useUpdateUserPermissions();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (users.data ?? []).filter((user) => {
      if (!term) return true;
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.department?.name ?? "").toLowerCase().includes(term)
      );
    });
  }, [query, users.data]);

  const selectedUser =
    (users.data ?? []).find((u) => u.id === selectedUserId) ??
    filteredUsers[0] ??
    null;

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
      {/* ── Left: User list ── */}
      <aside className="flex flex-col border-r border-slate-200">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Users</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Select a user to manage access
          </p>

          <div className="relative mt-3">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {users.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="px-3 py-12 text-center text-sm text-slate-500">
              No users found
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredUsers.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const badge = getRoleBadge(user);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                      isSelected
                        ? "bg-indigo-50 ring-1 ring-indigo-100"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                      )}
                    >
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            isSelected ? "text-indigo-900" : "text-slate-800",
                          )}
                        >
                          {user.name}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {user.department?.name ?? "No department"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                            badge.className,
                          )}
                        >
                          <badge.icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Right: Access panel ── */}
      <main className="flex flex-col overflow-hidden">
        {selectedUser ? (
          <UserAccessPanel
            key={selectedUser.id}
            user={selectedUser}
            featureGroups={features.data ?? []}
            saveAccess={saveAccess}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400">
            <UserIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">Select a user to manage their access</p>
          </div>
        )}
      </main>
    </div>
  );
}

function UserAccessPanel({
  user,
  featureGroups,
  saveAccess,
}: {
  user: AdminUser;
  featureGroups: FeatureGroup[];
  saveAccess: ReturnType<typeof useUpdateUserPermissions>;
}) {
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(() =>
    user.permissions.map((p) => p.id),
  );

  const toggleFeature = (feature: FeatureRef) => {
    setSelectedPermissionIds((current) => {
      const selected = new Set(current);
      const isOn = selected.has(feature.id);

      if (isOn) {
        selected.delete(feature.id);
        for (const group of featureGroups) {
          for (const child of group.features) {
            if (child.parentCode === feature.code) selected.delete(child.id);
          }
        }
      } else {
        selected.add(feature.id);
        if (feature.parentCode) {
          for (const group of featureGroups) {
            const parent = group.features.find(
              (item) => item.code === feature.parentCode,
            );
            if (parent) selected.add(parent.id);
          }
        }
      }
      return [...selected];
    });
  };

  const selectedIsSuperAdmin = roleCode(user) === ROLE.SUPER_ADMIN;
  const selectedIsAdmin = roleCode(user) === ROLE.ADMIN;
  const selectedIsViewer = roleCode(user) === ROLE.VIEWER;
  const selectedIsLocked = selectedIsSuperAdmin || selectedIsAdmin;
  const badge = getRoleBadge(user);

  const onSave = () => {
    if (selectedIsLocked) return;
    saveAccess.mutate({
      userId: user.id,
      permissionIds: selectedPermissionIds,
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-slate-900">
                {user.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  badge.className,
                )}
              >
                <badge.icon className="h-3.5 w-3.5" />
                {badge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {user.email}
              <span className="mx-1.5 text-slate-300">·</span>
              {user.department?.name ?? "No department"}
            </p>

            {/* Role info banner */}
            {selectedIsSuperAdmin ? (
              <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
                Super admins only manage Access Control and cannot receive
                dashboard features.
              </p>
            ) : selectedIsAdmin ? (
              <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                Admins automatically have access to every dashboard feature
                (except Access Control).
              </p>
            ) : selectedIsViewer ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Viewers can only receive page access. Action permissions stay
                disabled.
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Toggle the features this user can open, then enable the actions
                they can perform inside each one.
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={saveAccess.isPending || selectedIsLocked}
          onClick={onSave}
          className="shrink-0"
        >
          {saveAccess.isPending ? (
            <>
              <LoaderCircleIcon className="mr-1.5 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="mr-1.5 h-4 w-4" />
              Save access
            </>
          )}
        </Button>
      </div>

      {/* Feature groups */}
      {selectedIsSuperAdmin ? null : (
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {featureGroups.map((group) => {
              const roots = group.features.filter((f) => !f.parentCode);
              const childrenOf = (code: string) =>
                group.features.filter((f) => f.parentCode === code);

              return (
                <div
                  key={group.group}
                  className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {group.group}
                  </p>

                  <div className="flex flex-col gap-1">
                    {roots.map((root) => {
                      const children = childrenOf(root.code);
                      const rootChecked =
                        selectedIsAdmin ||
                        selectedPermissionIds.includes(root.id);

                      return (
                        <div key={root.id}>
                          <FeatureToggle
                            feature={root}
                            checked={rootChecked}
                            disabled={selectedIsLocked}
                            onToggle={() => toggleFeature(root)}
                          />

                          {children.length > 0 && (
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-slate-200 pl-3">
                              {children.map((child) => {
                                const lockedAction =
                                  selectedIsViewer && child.kind === "action";
                                return (
                                  <FeatureToggle
                                    key={child.id}
                                    feature={child}
                                    checked={
                                      selectedIsAdmin ||
                                      selectedPermissionIds.includes(child.id)
                                    }
                                    disabled={
                                      selectedIsLocked || lockedAction
                                    }
                                    hint={
                                      lockedAction
                                        ? "Viewers cannot perform this action"
                                        : undefined
                                    }
                                    onToggle={() => toggleFeature(child)}
                                    isChild
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function FeatureToggle({
  feature,
  checked,
  disabled,
  hint,
  onToggle,
  isChild = false,
}: {
  feature: FeatureRef;
  checked: boolean;
  disabled: boolean;
  hint?: string;
  onToggle: () => void;
  isChild?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:bg-white hover:shadow-sm",
      )}
      title={hint}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-slate-800",
              isChild ? "text-sm" : "text-sm",
            )}
          >
            {feature.label}
          </span>
          {feature.kind === "action" && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/60">
              Action
            </span>
          )}
        </div>
        {hint && (
          <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
        )}
      </div>

      {/* Custom toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onToggle();
        }}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
          checked ? "bg-indigo-600" : "bg-slate-200",
          disabled && "cursor-not-allowed opacity-70",
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}