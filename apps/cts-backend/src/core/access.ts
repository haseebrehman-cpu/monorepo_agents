import {
  FEATURE_BY_CODE,
  FEATURE_CODES,
  FEATURES,
  ROLE,
} from "../config/features.js";
import { pool } from "./db.js";

export type DepartmentRef = {
  id: number;
  code: string;
  name: string;
};

export type UserAccess = {
  isActive: boolean;
  roles: string[];
  permissions: string[];
  department: DepartmentRef | null;
};

export async function loadUserAccess(userId: number): Promise<UserAccess> {
  const { rows } = await pool.query(
    `SELECT
       u.is_active,
       d.id AS department_id,
       d.code AS department_code,
       d.name AS department_name,
       COALESCE(
         array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL),
         ARRAY[]::text[]
       ) AS roles,
       COALESCE(
         array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL),
         ARRAY[]::text[]
       ) AS permissions
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN user_permissions up ON up.user_id = u.id
     LEFT JOIN permissions p ON p.id = up.permission_id
     WHERE u.id = $1
     GROUP BY u.is_active, d.id, d.code, d.name`,
    [userId]
  );
  const row = rows[0];
  if (!row) {
    return { isActive: false, roles: [], permissions: [], department: null };
  }
  const roles = row.roles as string[];
  const department = row.department_id
    ? {
        id: row.department_id as number,
        code: row.department_code as string,
        name: row.department_name as string,
      }
    : null;

  if (roles.includes(ROLE.SUPER_ADMIN)) {
    return { isActive: row.is_active as boolean, roles, permissions: [], department };
  }

  if (roles.includes(ROLE.ADMIN)) {
    return {
      isActive: row.is_active as boolean,
      roles,
      permissions: [...FEATURE_CODES],
      department,
    };
  }

  return {
    isActive: row.is_active as boolean,
    roles,
    permissions: row.permissions as string[],
    department,
  };
}

export function expandPermissionCodes(codes: string[]): string[] {
  const selected = new Set(codes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const code of [...selected]) {
      const parent = FEATURE_BY_CODE.get(code)?.parentCode;
      if (parent && !selected.has(parent)) {
        selected.add(parent);
        changed = true;
      }
    }
  }
  return FEATURES.filter((feature) => selected.has(feature.code)).map(
    (feature) => feature.code
  );
}

export function filterCodesForRole(roleCode: string, codes: string[]): string[] {
  if (roleCode === ROLE.ADMIN || roleCode === ROLE.SUPER_ADMIN) return [];
  const expanded = expandPermissionCodes(codes);
  if (roleCode === ROLE.VIEWER) {
    return expanded.filter((code) => FEATURE_BY_CODE.get(code)?.kind === "access");
  }
  return expanded;
}
