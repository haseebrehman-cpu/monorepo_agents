import { useMemo, useState } from "react";
import { Button, cn } from "@rdx/ui";
import { LoaderCircleIcon } from "lucide-react";
import type { AdminUser, FeatureGroup, FeatureRef } from "../../../lib/admin-api";
import { ROLE } from "../../../lib/permissions";
import { useAdminFeatures, useAdminUsers, useUpdateUserPermissions } from "../../../lib/use-admin";

function roleCode(user: AdminUser) {
  return user.roles[0]?.code ?? "";
}

function roleName(user: AdminUser) {
  return user.roles[0]?.name ?? "No role";
}

function featureSummary(user: AdminUser) {
  if (roleCode(user) === ROLE.SUPER_ADMIN) return "Access control only";
  if (roleCode(user) === ROLE.ADMIN) return "All dashboard features";
  const groups = [
    ...new Set((user.permissions ?? []).map((permission) => permission.group).filter(Boolean)),
  ];
  if (groups.length === 0) return "No features assigned";
  return groups.join(", ");
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
    (users.data ?? []).find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users"
          className="mb-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        {users.isLoading ? (
          <p className="px-3 py-4 text-sm text-slate-500">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="px-3 py-4 text-sm text-slate-500">No users found.</p>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedUserId(user.id)}
              className={cn(
                "flex w-full flex-col rounded-md px-3 py-2 text-left text-sm",
                selectedUser?.id === user.id
                  ? "bg-indigo-50 text-indigo-800"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-slate-500">
                {user.department?.name ?? "No department"} · {roleName(user)}
              </span>
              <span className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                {featureSummary(user)}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {selectedUser ? (
          <UserAccessPanel
            key={selectedUser.id}
            user={selectedUser}
            featureGroups={features.data ?? []}
            saveAccess={saveAccess}
          />
        ) : (
          <p className="text-sm text-slate-500">Select a user to assign features.</p>
        )}
      </div>
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
    user.permissions.map((permission) => permission.id),
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
            const parent = group.features.find((item) => item.code === feature.parentCode);
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

  const onSave = () => {
    if (selectedIsLocked) return;
    saveAccess.mutate({ userId: user.id, permissionIds: selectedPermissionIds });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{user.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {user.email} · {user.department?.name ?? "No department"} · {roleName(user)}
          </p>
          {selectedIsSuperAdmin ? (
            <p className="mt-2 text-sm text-indigo-700">
              Super admin only has Access control and cannot be given dashboard features.
            </p>
          ) : selectedIsAdmin ? (
            <p className="mt-2 text-sm text-indigo-700">
              Admin has access to every dashboard feature except Access control.
            </p>
          ) : selectedIsViewer ? (
            <p className="mt-2 text-sm text-slate-500">
              Viewers can only be given page access. Actions such as Add Tracking stay off.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Choose the features this user can open, then the actions they can perform inside each one.
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={saveAccess.isPending || selectedIsLocked}
          onClick={onSave}
        >
          {saveAccess.isPending ? (
            <>
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save access"
          )}
        </Button>
      </div>

      {selectedIsSuperAdmin ? null : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {featureGroups.map((group) => {
            const roots = group.features.filter((feature) => !feature.parentCode);
            const childrenOf = (code: string) =>
              group.features.filter((feature) => feature.parentCode === code);

            return (
              <div key={group.group} className="rounded-lg border border-slate-100 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.group}
                </p>
                <div className="flex flex-col gap-2">
                  {roots.map((root) => {
                    const children = childrenOf(root.code);
                    return (
                      <div key={root.id}>
                        <FeatureCheckbox
                          feature={root}
                          checked={selectedIsAdmin || selectedPermissionIds.includes(root.id)}
                          disabled={selectedIsLocked}
                          onToggle={() => toggleFeature(root)}
                        />
                        {children.length > 0 ? (
                          <div className="mt-1 ml-6 flex flex-col gap-1.5 border-l border-slate-100 pl-3">
                            {children.map((child) => {
                              const lockedAction = selectedIsViewer && child.kind === "action";
                              return (
                                <FeatureCheckbox
                                  key={child.id}
                                  feature={child}
                                  checked={
                                    selectedIsAdmin || selectedPermissionIds.includes(child.id)
                                  }
                                  disabled={selectedIsLocked || lockedAction}
                                  hint={
                                    lockedAction
                                      ? "Viewers cannot perform this action"
                                      : undefined
                                  }
                                  onToggle={() => toggleFeature(child)}
                                />
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function FeatureCheckbox({
  feature,
  checked,
  disabled,
  hint,
  onToggle,
}: {
  feature: FeatureRef;
  checked: boolean;
  disabled: boolean;
  hint?: string;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 text-sm text-slate-700",
        disabled && "cursor-not-allowed opacity-70",
      )}
      title={hint}
    >
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span>
        <span className="font-medium">{feature.label}</span>
        {feature.kind === "action" ? (
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Action
          </span>
        ) : null}
        {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
      </span>
    </label>
  );
}
