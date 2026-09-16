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
  roles: string[];
  permissions: string[];
  department: DepartmentRef | null;
};

export async function loadUserAccess(userId: number): Promise<UserAccess> {
  const { rows: roleRows } = await pool.query(
    `SELECT r.code
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  const roles = roleRows.map((row: { code: string }) => row.code);

  const { rows: deptRows } = await pool.query(
    `SELECT d.id, d.code, d.name
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     WHERE u.id = $1`,
    [userId]
  );
  const department = deptRows[0]?.id
    ? {
        id: deptRows[0].id as number,
        code: deptRows[0].code as string,
        name: deptRows[0].name as string,
      }
    : null;

  if (roles.includes(ROLE.SUPER_ADMIN)) {
    return { roles, permissions: [], department };
  }

  if (roles.includes(ROLE.ADMIN)) {
    return { roles, permissions: [...FEATURE_CODES], department };
  }

  const { rows: permRows } = await pool.query(
    `SELECT p.code
     FROM user_permissions up
     JOIN permissions p ON p.id = up.permission_id
     WHERE up.user_id = $1`,
    [userId]
  );

  return {
    roles,
    permissions: permRows.map((row: { code: string }) => row.code),
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
