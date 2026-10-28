import { pool } from "../../core/db.js";
import {
  RESEND_LOOKUP_COLUMNS,
  RESEND_LOOKUP_ERRORS,
  RESEND_LOOKUP_KINDS,
  type ResendLookupKind,
} from "./resend-lookups.constants.js";
import type {
  CreateResendLookupInput,
  UpdateResendLookupInput,
} from "./resend-lookups.schema.js";

function mapLookup(row: Record<string, unknown>) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export const resendLookupsService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, kind, label, is_active, sort_order
       FROM resend_lookups
       ORDER BY kind, sort_order, id`
    );
    return rows.map(mapLookup);
  },

  async listActiveByKind() {
    const { rows } = await pool.query(
      `SELECT kind, label
       FROM resend_lookups
       WHERE is_active = TRUE
       ORDER BY kind, sort_order, id`
    );

    const grouped = Object.fromEntries(
      RESEND_LOOKUP_KINDS.map((kind) => [kind, [] as string[]])
    ) as Record<ResendLookupKind, string[]>;

    for (const row of rows) {
      const kind = row.kind as ResendLookupKind;
      if (grouped[kind]) grouped[kind].push(row.label as string);
    }

    return grouped;
  },

  async assertActive(kind: ResendLookupKind, label: string) {
    const { rows } = await pool.query(
      `SELECT label
       FROM resend_lookups
       WHERE kind = $1 AND lower(label) = lower($2) AND is_active = TRUE`,
      [kind, label]
    );
    if (!rows.length) throw new Error(RESEND_LOOKUP_ERRORS[kind]);
    return rows[0].label as string;
  },

  async create(input: CreateResendLookupInput) {
    const { rows: orderRows } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_order
       FROM resend_lookups
       WHERE kind = $1`,
      [input.kind]
    );

    try {
      const { rows } = await pool.query(
        `INSERT INTO resend_lookups (kind, label, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id, kind, label, is_active, sort_order`,
        [input.kind, input.label, orderRows[0].next_order]
      );
      return mapLookup(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("LOOKUP_ALREADY_EXISTS");
      throw error;
    }
  },

  async update(id: number, input: UpdateResendLookupInput) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM resend_lookups WHERE id = $1`,
      [id]
    );
    if (!existing.length) throw new Error("LOOKUP_NOT_FOUND");

    try {
      const { rows } = await pool.query(
        `UPDATE resend_lookups
         SET label = COALESCE($2, label),
             is_active = COALESCE($3, is_active),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, kind, label, is_active, sort_order`,
        [id, input.label, input.isActive]
      );
      return mapLookup(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("LOOKUP_ALREADY_EXISTS");
      throw error;
    }
  },

  async remove(id: number) {
    const { rows } = await pool.query(
      `SELECT id, kind, label FROM resend_lookups WHERE id = $1`,
      [id]
    );
    if (!rows.length) throw new Error("LOOKUP_NOT_FOUND");

    const kind = rows[0].kind as ResendLookupKind;
    const column = RESEND_LOOKUP_COLUMNS[kind];
    const { rows: used } = await pool.query(
      `SELECT 1 FROM resends WHERE ${column} = $1 LIMIT 1`,
      [rows[0].label]
    );
    if (used.length) throw new Error("LOOKUP_IN_USE");

    await pool.query(`DELETE FROM resend_lookups WHERE id = $1`, [id]);
  },
};
