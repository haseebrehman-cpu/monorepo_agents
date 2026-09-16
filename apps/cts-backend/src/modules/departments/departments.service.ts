import { pool } from "../../core/db.js";

export const departmentsService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, code, name FROM departments ORDER BY name`
    );
    return rows;
  },
};
