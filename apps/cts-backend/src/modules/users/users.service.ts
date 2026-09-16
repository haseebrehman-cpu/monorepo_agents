import { ASSIGNABLE_ROLE_CODES, ROLE } from "../../config/features.js";
import { pool } from "../../core/db.js";
import { hashPassword } from "../../core/password.js";
import { filterCodesForRole } from "../../core/access.js";
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPermissionsInput,
} from "./users.schema.js";

const USER_LIST_SQL = `
  SELECT
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.created_at,
    CASE
      WHEN d.id IS NULL THEN NULL
      ELSE json_build_object('id', d.id, 'code', d.code, 'name', d.name)
    END AS department,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object('id', r.id, 'code', r.code, 'name', r.name)
        )
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id
      ),
      '[]'
    ) AS roles,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', p.id,
            'code', p.code,
            'label', COALESCE(p.label, p.description),
            'kind', p.kind,
            'group', p.feature_group,
            'parentCode', p.parent_code
          )
          ORDER BY p.sort_order, p.code
        )
        FROM user_permissions up
        JOIN permissions p ON p.id = up.permission_id
        WHERE up.user_id = u.id
      ),
      '[]'
    ) AS permissions
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id
`;

export const usersService = {
  async list() {
    const { rows } = await pool.query(`${USER_LIST_SQL} ORDER BY u.created_at DESC`);
    return rows;
  },

  async create(input: CreateUserInput) {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      input.email,
    ]);
    if (existing.rowCount) throw new Error("USER_ALREADY_EXISTS");

    await assertDepartmentExists(input.departmentId);
    await assertRoleExists(input.roleId);

    const passwordHash = await hashPassword(input.password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, name, department_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.email, passwordHash, input.name, input.departmentId]
      );
      const userId = rows[0].id as number;
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [userId, input.roleId]
      );
      await client.query("COMMIT");
      return this.getById(userId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id: number) {
    const current = await this.getById(id);
    if (!current) throw new Error("USER_NOT_FOUND");

    await guardSuperAdmin(id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM user_permissions WHERE user_id = $1", [id]);
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
      await client.query("DELETE FROM users WHERE id = $1", [id]);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id: number, input: UpdateUserInput) {
    const current = await this.getById(id);
    if (!current) throw new Error("USER_NOT_FOUND");

    if (input.departmentId) await assertDepartmentExists(input.departmentId);
    if (input.roleId) await assertRoleExists(input.roleId);

    if (input.roleId || input.is_active === false) {
      await guardSuperAdmin(id);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (
        input.name !== undefined ||
        input.is_active !== undefined ||
        input.departmentId !== undefined
      ) {
        await client.query(
          `UPDATE users
           SET name = COALESCE($2, name),
               is_active = COALESCE($3, is_active),
               department_id = COALESCE($4, department_id),
               updated_at = NOW()
           WHERE id = $1`,
          [id, input.name ?? null, input.is_active ?? null, input.departmentId ?? null]
        );
      }
      if (input.roleId) {
        const nextRole = await getRoleCode(input.roleId);
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
          [id, input.roleId]
        );
        if (nextRole === ROLE.ADMIN) {
          await client.query(`DELETE FROM user_permissions WHERE user_id = $1`, [id]);
        } else if (nextRole === ROLE.VIEWER) {
          await client.query(
            `DELETE FROM user_permissions up
             USING permissions p
             WHERE up.permission_id = p.id
               AND up.user_id = $1
               AND p.kind = 'action'`,
            [id]
          );
        }
      }
      await client.query("COMMIT");
      return this.getById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async updatePermissions(id: number, input: UpdateUserPermissionsInput) {
    const current = await this.getById(id);
    if (!current) throw new Error("USER_NOT_FOUND");

    const roleCode = current.roles?.[0]?.code as string | undefined;
    if (!roleCode) throw new Error("ROLE_NOT_FOUND");
    if (roleCode === ROLE.ADMIN || roleCode === ROLE.SUPER_ADMIN) {
      return this.getById(id);
    }

    const permissionIds = await resolveAssignablePermissionIds(roleCode, input.permissionIds);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM user_permissions WHERE user_id = $1`, [id]);
      for (const permissionId of permissionIds) {
        await client.query(
          `INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)`,
          [id, permissionId]
        );
      }
      await client.query("COMMIT");
      return this.getById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getById(id: number) {
    const { rows } = await pool.query(`${USER_LIST_SQL} WHERE u.id = $1`, [id]);
    return rows[0] ?? null;
  },
};

async function assertDepartmentExists(departmentId: number) {
  const { rowCount } = await pool.query(`SELECT id FROM departments WHERE id = $1`, [
    departmentId,
  ]);
  if (!rowCount) throw new Error("DEPARTMENT_NOT_FOUND");
}

async function assertRoleExists(roleId: number) {
  const { rowCount } = await pool.query(
    `SELECT id FROM roles WHERE id = $1 AND code = ANY($2::text[])`,
    [roleId, [...ASSIGNABLE_ROLE_CODES]]
  );
  if (!rowCount) throw new Error("ROLE_NOT_FOUND");
}

async function getRoleCode(roleId: number) {
  const { rows } = await pool.query(`SELECT code FROM roles WHERE id = $1`, [roleId]);
  return (rows[0]?.code as string | undefined) ?? null;
}

async function resolveAssignablePermissionIds(roleCode: string, permissionIds: number[]) {
  if (!permissionIds.length) return [];

  const { rows } = await pool.query(
    `SELECT id, code FROM permissions WHERE id = ANY($1::int[])`,
    [permissionIds]
  );
  if (rows.length !== new Set(permissionIds).size) {
    throw new Error("PERMISSION_NOT_FOUND");
  }

  const allowedCodes = filterCodesForRole(
    roleCode,
    rows.map((row: { code: string }) => row.code)
  );

  if (!allowedCodes.length) return [];

  const { rows: allowed } = await pool.query(
    `SELECT id FROM permissions WHERE code = ANY($1::text[])`,
    [allowedCodes]
  );
  return allowed.map((row: { id: number }) => row.id);
}

async function guardSuperAdmin(userId: number) {
  const roleCode = await getUserRoleCode(userId);
  if (roleCode === ROLE.SUPER_ADMIN) {
    throw new Error("SUPER_ADMIN_LOCKED");
  }
}

async function getUserRoleCode(userId: number) {
  const { rows } = await pool.query(
    `SELECT r.code
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return (rows[0]?.code as string | undefined) ?? null;
}
