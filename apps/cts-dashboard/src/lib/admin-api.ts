import { authedApi } from "./auth";

export type RoleRef = {
  id: number;
  code: string;
  name: string;
};

export type DepartmentRef = {
  id: number;
  code: string;
  name: string;
};

export type FeatureRef = {
  id: number;
  code: string;
  label: string;
  group: string;
  kind: "access" | "action" | string;
  parentCode: string | null;
  sortOrder?: number;
};

export type FeatureGroup = {
  group: string;
  features: FeatureRef[];
};

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  department: DepartmentRef | null;
  roles: RoleRef[];
  permissions: FeatureRef[];
};

type ListResponse<T> = { success: true; data: T };

export function listUsers() {
  return authedApi().request<ListResponse<AdminUser[]>>("/api/users");
}

export function createUser(input: {
  email: string;
  password: string;
  name: string;
  departmentId: number;
  roleId: number;
}) {
  return authedApi().request<ListResponse<AdminUser>>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateUser(
  id: number,
  input: {
    name?: string;
    is_active?: boolean;
    departmentId?: number;
    roleId?: number;
  },
) {
  return authedApi().request<ListResponse<AdminUser>>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateUserPermissions(id: number, permissionIds: number[]) {
  return authedApi().request<ListResponse<AdminUser>>(`/api/users/${id}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissionIds }),
  });
}

export function deleteUser(id: number) {
  return authedApi().request<{ success: true }>(`/api/users/${id}`, {
    method: "DELETE",
  });
}

export function listRoles() {
  return authedApi().request<ListResponse<RoleRef[]>>("/api/roles");
}

export function listDepartments() {
  return authedApi().request<ListResponse<DepartmentRef[]>>("/api/departments");
}

export function listFeatures() {
  return authedApi().request<ListResponse<FeatureGroup[]>>("/api/roles/features");
}
