import { pool } from "../../core/db.js";
import {
  REFUND_LOOKUP_COLUMNS,
  REFUND_LOOKUP_ERRORS,
  REFUND_LOOKUP_KINDS,
  type RefundLookupKind,
} from "./refund-lookups.constants.js";
import type {
  CreateRefundLookupInput,
  UpdateRefundLookupInput,
} from "./refund-lookups.schema.js";

function mapLookup(row: Record<string, unknown>) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export const refundLookupsService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, kind, label, is_active, sort_order
       FROM refund_lookups
       ORDER BY kind, sort_order, id`
    );
    return rows.map(mapLookup);
  },

  async listActiveByKind() {
    const { rows } = await pool.query(
      `SELECT kind, label
       FROM refund_lookups
       WHERE is_active = TRUE
       ORDER BY kind, sort_order, id`
    );

    const grouped = Object.fromEntries(
      REFUND_LOOKUP_KINDS.map((kind) => [kind, [] as string[]])
    ) as Record<RefundLookupKind, string[]>;

    for (const row of rows) {
      const kind = row.kind as RefundLookupKind;
      if (grouped[kind]) grouped[kind].push(row.label as string);
    }

    return grouped;
  },

  async assertActive(kind: RefundLookupKind, label: string) {
    const { rows } = await pool.query(
      `SELECT label
       FROM refund_lookups
       WHERE kind = $1 AND lower(label) = lower($2) AND is_active = TRUE`,
      [kind, label]
    );
    if (!rows.length) throw new Error(REFUND_LOOKUP_ERRORS[kind]);
    return rows[0].label as string;
  },

  async create(input: CreateRefundLookupInput) {
    const { rows: orderRows } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_order
       FROM refund_lookups
       WHERE kind = $1`,
      [input.kind]
    );

    try {
      const { rows } = await pool.query(
        `INSERT INTO refund_lookups (kind, label, sort_order)
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

  async update(id: number, input: UpdateRefundLookupInput) {
    const { rows: existing } = await pool.query(
      `SELECT id FROM refund_lookups WHERE id = $1`,
      [id]
    );
    if (!existing.length) throw new Error("LOOKUP_NOT_FOUND");

    try {
      const { rows } = await pool.query(
        `UPDATE refund_lookups
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
      `SELECT id, kind, label FROM refund_lookups WHERE id = $1`,
      [id]
    );
    if (!rows.length) throw new Error("LOOKUP_NOT_FOUND");

    const kind = rows[0].kind as RefundLookupKind;
    const column = REFUND_LOOKUP_COLUMNS[kind];
    const { rows: used } = await pool.query(
      `SELECT 1 FROM refunds WHERE ${column} = $1 LIMIT 1`,
      [rows[0].label]
    );
    if (used.length) throw new Error("LOOKUP_IN_USE");

    await pool.query(`DELETE FROM refund_lookups WHERE id = $1`, [id]);
  },
};
