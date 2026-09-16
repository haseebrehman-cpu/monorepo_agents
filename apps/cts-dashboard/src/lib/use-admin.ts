import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import {
  createUser,
  deleteUser,
  listDepartments,
  listFeatures,
  listRoles,
  listUsers,
  updateUser,
  updateUserPermissions,
} from "./admin-api";

function adminErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.message === "USER_ALREADY_EXISTS") return "A user with that email already exists.";
    if (error.message === "USER_NOT_FOUND") return "That user no longer exists.";
    if (error.message === "SUPER_ADMIN_LOCKED") return "The super admin account cannot be changed or removed.";
    if (error.message === "SUPER_ADMIN_ONLY") return "Only the super admin can manage access.";
    if (error.message === "ADMIN_ONLY") return "Only the super admin can manage access.";
    if (error.message === "DEPARTMENT_NOT_FOUND") return "Select a valid department.";
    if (error.message === "ROLE_NOT_FOUND") return "Select a valid role.";
    if (error.message) return error.message;
  }
  return fallback;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await listUsers()).data,
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => (await listRoles()).data,
  });
}

export function useAdminDepartments() {
  return useQuery({
    queryKey: ["admin-departments"],
    queryFn: async () => (await listDepartments()).data,
  });
}

export function useAdminFeatures() {
  return useQuery({
    queryKey: ["admin-features"],
    queryFn: async () => (await listFeatures()).data,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not create user."));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: number;
      name?: string;
      is_active?: boolean;
      departmentId?: number;
      roleId?: number;
    }) => updateUser(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not update user."));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not delete user."));
    },
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionIds,
    }: {
      userId: number;
      permissionIds: number[];
    }) => updateUserPermissions(userId, permissionIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Access saved");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not save access."));
    },
  });
}
