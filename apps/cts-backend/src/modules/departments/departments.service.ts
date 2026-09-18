import { pool } from "../../core/db.js";
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./departments.schema.js";

function mapDepartment(row: Record<string, unknown>) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
  };
}

function slugify(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return slug || "department";
}

async function uniqueCode(base: string) {
  let code = base;
  let suffix = 2;
  while (true) {
    const { rows } = await pool.query(`SELECT 1 FROM departments WHERE code = $1 LIMIT 1`, [
      code,
    ]);
    if (!rows.length) return code;
    code = `${base}_${suffix}`.slice(0, 80);
    suffix += 1;
  }
}

export const departmentsService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, code, name FROM departments ORDER BY name`
    );
    return rows.map(mapDepartment);
  },

  async create(input: CreateDepartmentInput) {
    const code = await uniqueCode(slugify(input.name));
    try {
      const { rows } = await pool.query(
        `INSERT INTO departments (code, name)
         VALUES ($1, $2)
         RETURNING id, code, name`,
        [code, input.name]
      );
      return mapDepartment(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("DEPARTMENT_ALREADY_EXISTS");
      throw error;
    }
  },

  async update(id: number, input: UpdateDepartmentInput) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM departments WHERE id = $1`,
      [id]
    );
    if (!existing.length) throw new Error("DEPARTMENT_NOT_FOUND");

    try {
      const { rows } = await pool.query(
        `UPDATE departments
         SET name = $2
         WHERE id = $1
         RETURNING id, code, name`,
        [id, input.name]
      );
      return mapDepartment(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("DEPARTMENT_ALREADY_EXISTS");
      throw error;
    }
  },

  async remove(id: number) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM departments WHERE id = $1`,
      [id]
    );
    if (!existing.length) throw new Error("DEPARTMENT_NOT_FOUND");

    const { rows: used } = await pool.query(
      `SELECT 1
       FROM (
         SELECT 1 FROM users WHERE department_id = $1
         UNION ALL
         SELECT 1 FROM tickets WHERE assigned_department_id = $1
         UNION ALL
         SELECT 1 FROM ticket_replies WHERE assigned_department_id = $1
       ) used
       LIMIT 1`,
      [id]
    );
    if (used.length) throw new Error("DEPARTMENT_IN_USE");

    await pool.query(`DELETE FROM departments WHERE id = $1`, [id]);
  },
};
