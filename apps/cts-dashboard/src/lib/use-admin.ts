import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiError } from "@rdx/api-client";
import {
  createDepartment,
  createTicketLookup,
  createUser,
  deleteDepartment,
  deleteTicketLookup,
  deleteUser,
  listDepartments,
  listFeatures,
  listRoles,
  listTicketLookups,
  listUsers,
  updateDepartment,
  updateTicketLookup,
  updateUser,
  updateUserPermissions,
  type TicketLookupKind,
} from "./admin-api";

function adminErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.message === "USER_ALREADY_EXISTS") return "A user with that email already exists.";
    if (error.message === "USER_NOT_FOUND") return "That user no longer exists.";
    if (error.message === "SUPER_ADMIN_LOCKED") return "The super admin account cannot be changed or removed.";
    if (error.message === "SUPER_ADMIN_ONLY") return "Only the super admin can manage access.";
    if (error.message === "ADMIN_ONLY") return "Only the super admin can manage access.";
    if (error.message === "DEPARTMENT_NOT_FOUND") return "Select a valid department.";
    if (error.message === "DEPARTMENT_ALREADY_EXISTS") return "A department with that name already exists.";
    if (error.message === "DEPARTMENT_IN_USE") {
      return "This department is assigned to users or tickets, so it cannot be deleted.";
    }
    if (error.message === "ROLE_NOT_FOUND") return "Select a valid role.";
    if (error.message === "LOOKUP_ALREADY_EXISTS") return "That value already exists.";
    if (error.message === "LOOKUP_NOT_FOUND") return "That value no longer exists.";
    if (error.message === "LOOKUP_IN_USE") return "This value is used on existing tickets. Deactivate it instead.";
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

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Department added");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not add department."));
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateDepartment(id, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Department updated");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not update department."));
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Department removed");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not remove department."));
    },
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

export function useTicketLookups() {
  return useQuery({
    queryKey: ["ticket-lookups"],
    queryFn: async () => (await listTicketLookups()).data,
  });
}

export function useCreateTicketLookup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicketLookup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket-lookups"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Value added");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not add value."));
    },
  });
}

export function useUpdateTicketLookup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: number;
      label?: string;
      isActive?: boolean;
      isClosed?: boolean;
    }) => updateTicketLookup(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket-lookups"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Value updated");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not update value."));
    },
  });
}

export function useDeleteTicketLookup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTicketLookup(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket-lookups"] });
      await queryClient.invalidateQueries({ queryKey: ["ticket-options"] });
      toast.success("Value removed");
    },
    onError: (error) => {
      toast.error(adminErrorMessage(error, "Could not remove value."));
    },
  });
}

export type { TicketLookupKind };
