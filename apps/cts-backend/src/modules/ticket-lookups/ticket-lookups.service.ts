import { pool } from "../../core/db.js";
import type { TicketLookupKind } from "./ticket-lookups.constants.js";
import type {
  CreateTicketLookupInput,
  UpdateTicketLookupInput,
} from "./ticket-lookups.schema.js";

function mapLookup(row: Record<string, unknown>) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    isActive: row.is_active,
    isClosed: row.is_closed,
    sortOrder: row.sort_order,
  };
}

export const ticketLookupsService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, kind, label, is_active, is_closed, sort_order
       FROM ticket_lookups
       ORDER BY kind, sort_order, id`
    );
    return rows.map(mapLookup);
  },

  async listActiveByKind() {
    const { rows } = await pool.query(
      `SELECT kind, label, is_closed
       FROM ticket_lookups
       WHERE is_active = TRUE
       ORDER BY kind, sort_order, id`
    );

    const couriers: string[] = [];
    const issues: string[] = [];
    const statuses: string[] = [];
    const closedStatuses = new Set<string>();

    for (const row of rows) {
      if (row.kind === "courier") couriers.push(row.label);
      if (row.kind === "issue") issues.push(row.label);
      if (row.kind === "status") {
        statuses.push(row.label);
        if (row.is_closed) closedStatuses.add(row.label);
      }
    }

    return { couriers, issues, statuses, closedStatuses };
  },

  async assertActive(kind: TicketLookupKind, label: string) {
    const { rows } = await pool.query(
      `SELECT label, is_closed
       FROM ticket_lookups
       WHERE kind = $1 AND lower(label) = lower($2) AND is_active = TRUE`,
      [kind, label]
    );
    if (!rows.length) {
      const errors: Record<TicketLookupKind, string> = {
        courier: "INVALID_COURIER",
        issue: "INVALID_ISSUE",
        status: "INVALID_STATUS",
      };
      throw new Error(errors[kind]);
    }
    return {
      label: rows[0].label as string,
      isClosed: Boolean(rows[0].is_closed),
    };
  },

  async create(input: CreateTicketLookupInput) {
    const { rows: orderRows } = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_order
       FROM ticket_lookups
       WHERE kind = $1`,
      [input.kind]
    );

    try {
      const { rows } = await pool.query(
        `INSERT INTO ticket_lookups (kind, label, is_closed, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, kind, label, is_active, is_closed, sort_order`,
        [
          input.kind,
          input.label,
          input.kind === "status" ? input.isClosed : false,
          orderRows[0].next_order,
        ]
      );
      return mapLookup(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("LOOKUP_ALREADY_EXISTS");
      throw error;
    }
  },

  async update(id: number, input: UpdateTicketLookupInput) {
    const { rows: existing } = await pool.query(
      `SELECT id, kind FROM ticket_lookups WHERE id = $1`,
      [id]
    );
    if (!existing.length) throw new Error("LOOKUP_NOT_FOUND");

    const isClosed =
      existing[0].kind === "status" ? input.isClosed : undefined;

    try {
      const { rows } = await pool.query(
        `UPDATE ticket_lookups
         SET label = COALESCE($2, label),
             is_active = COALESCE($3, is_active),
             is_closed = COALESCE($4, is_closed),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, kind, label, is_active, is_closed, sort_order`,
        [id, input.label, input.isActive, isClosed]
      );
      return mapLookup(rows[0]);
    } catch (error: any) {
      if (error.code === "23505") throw new Error("LOOKUP_ALREADY_EXISTS");
      throw error;
    }
  },

  async remove(id: number) {
    const { rows } = await pool.query(
      `SELECT id, kind, label FROM ticket_lookups WHERE id = $1`,
      [id]
    );
    if (!rows.length) throw new Error("LOOKUP_NOT_FOUND");

    const { kind, label } = rows[0];
    const column =
      kind === "courier" ? "courier" : kind === "issue" ? "issue" : "status";
    const { rows: used } = await pool.query(
      `SELECT 1 FROM tickets WHERE ${column} = $1 LIMIT 1`,
      [label]
    );
    if (used.length) throw new Error("LOOKUP_IN_USE");

    await pool.query(`DELETE FROM ticket_lookups WHERE id = $1`, [id]);
  },
};
