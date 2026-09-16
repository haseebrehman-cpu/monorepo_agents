import { useState, type FormEvent } from "react";
import { Button, DropDown, Input } from "@rdx/ui";
import { LoaderCircleIcon } from "lucide-react";
import { getAuthUser } from "../../../lib/auth";
import { ROLE } from "../../../lib/permissions";
import type { AdminUser } from "../../../lib/admin-api";
import {
  useAdminDepartments,
  useAdminRoles,
  useAdminUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "../../../lib/use-admin";
import DeleteUserDialog from "./DeleteUserDialog";

export default function UsersManager() {
  const users = useAdminUsers();
  const roles = useAdminRoles();
  const departments = useAdminDepartments();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const currentUserId = getAuthUser()?.id;
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  const onCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentId || !roleId) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    createUser.mutate(
      {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        departmentId: Number(departmentId),
        roleId: Number(roleId),
      },
      {
        onSuccess: () => {
          formEl.reset();
          setDepartmentId(null);
          setRoleId(null);
        },
      },
    );
  };

  const onDelete = (user: AdminUser) => {
    if (user.id === currentUserId) return;
    setUserToDelete(user);
  };

  const onConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUser.mutate(userToDelete.id, {
      onSuccess: () => setUserToDelete(null),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={onCreate}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900">Create user</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a department and a role. Admins get the full dashboard except Access control. Feature access for User and Viewer is assigned on the User access tab.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="new-user-name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input id="new-user-name" name="name" required />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="new-user-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input id="new-user-email" name="email" type="email" required />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="new-user-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="new-user-password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="new-user-department" className="text-sm font-medium text-slate-700">
              Department
            </label>
            <DropDown
              id="new-user-department"
              label="Select department"
              className="w-full"
              value={departmentId}
              onChange={setDepartmentId}
              options={(departments.data ?? []).map((department) => ({
                label: department.name,
                value: String(department.id),
              }))}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="new-user-role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <DropDown
              id="new-user-role"
              label="Select role"
              className="w-full"
              value={roleId}
              onChange={setRoleId}
              options={(roles.data ?? []).map((role) => ({
                label: role.name,
                value: String(role.id),
              }))}
            />
            <p className="text-xs text-slate-500">
              Admin can use every dashboard page except Access control. User can act on assigned features. Viewer can only view them.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={createUser.isPending || !departmentId || !roleId}
          >
            {createUser.isPending ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create user"
            )}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">Users</h2>
        </div>
        {users.isLoading ? (
          <p className="px-4 py-6 text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isDeleting = deleteUser.isPending && deleteUser.variables === user.id;
                  const currentRole = user.roles[0];
                  const isLockedSuperAdmin = currentRole?.code === ROLE.SUPER_ADMIN;
                  return (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        {isLockedSuperAdmin ? (
                          <span className="text-slate-500">
                            {user.department?.name ?? "—"}
                          </span>
                        ) : (
                          <DropDown
                            className="w-44"
                            label="Department"
                            value={user.department ? String(user.department.id) : null}
                            onChange={(value) => {
                              if (!value) return;
                              updateUser.mutate({ id: user.id, departmentId: Number(value) });
                            }}
                            options={(departments.data ?? []).map((department) => ({
                              label: department.name,
                              value: String(department.id),
                            }))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isLockedSuperAdmin ? (
                          <span className="font-medium text-slate-900">
                            {currentRole?.name ?? "Super Admin"}
                          </span>
                        ) : (
                          <DropDown
                            className="w-32"
                            label="Role"
                            value={currentRole ? String(currentRole.id) : null}
                            onChange={(value) => {
                              if (!value) return;
                              updateUser.mutate({ id: user.id, roleId: Number(value) });
                            }}
                            options={(roles.data ?? []).map((role) => ({
                              label: role.name,
                              value: String(role.id),
                            }))}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={user.is_active ? "outline" : "primary"}
                          disabled={
                            isLockedSuperAdmin || updateUser.isPending || deleteUser.isPending
                          }
                          title={
                            isLockedSuperAdmin
                              ? "The super admin account stays active"
                              : undefined
                          }
                          onClick={() =>
                            updateUser.mutate({ id: user.id, is_active: !user.is_active })
                          }
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          disabled={isSelf || isLockedSuperAdmin || deleteUser.isPending}
                          title={
                            isLockedSuperAdmin
                              ? "The super admin account cannot be deleted"
                              : isSelf
                                ? "You cannot delete your own account"
                                : "Delete user"
                          }
                          onClick={() => onDelete(user)}
                        >
                          {isDeleting ? (
                            <>
                              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteUserDialog
        user={userToDelete}
        open={userToDelete !== null}
        isDeleting={deleteUser.isPending}
        onOpenChange={(open) => {
          if (!open && !deleteUser.isPending) setUserToDelete(null);
        }}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
