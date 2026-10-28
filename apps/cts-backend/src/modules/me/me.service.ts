import { pool } from "../../core/db.js";
import { loadUserAccess } from "../../core/access.js";
import { P } from "../../config/features.js";

type TicketTypeConfig = {
  code: string;
  name: string;
  description: string | null;
  allowedActions: string[];
  fields: {
    key: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
    options: any[] | null;
  }[];
};

const TICKET_CREATE_PERMISSION: Record<string, string> = {
  refund: P.REFUND_CREATE,
  return: P.RETURN_CREATE,
  resend: P.RESEND_CREATE,
};

const TICKET_VIEW_PERMISSION: Record<string, string> = {
  refund: P.REFUND_ACCESS,
  return: P.RETURN_ACCESS,
  resend: P.RESEND_ACCESS,
};

export const meService = {
  async getConfig(userId: number) {
    const userQ = await pool.query(
      `SELECT id, email, name, is_active, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!userQ.rows[0]) throw new Error("USER_NOT_FOUND");
    const user = userQ.rows[0];

    const access = await loadUserAccess(userId);
    const roles = access.roles;
    const permissions = access.permissions;

    const ttQ = await pool.query(
      `SELECT id, code, name, description, sort_order
       FROM ticket_types
       WHERE is_active = TRUE
       ORDER BY sort_order, name`
    );

    const ticketTypes: TicketTypeConfig[] = [];

    const fieldsQ = await pool.query(
      `SELECT ticket_type_id, field_key, label, field_type, is_required, default_value, options_json
       FROM ticket_type_fields
       WHERE ticket_type_id = ANY($1::int[])
       ORDER BY ticket_type_id, sort_order, id`,
      [ttQ.rows.map((tt) => tt.id)]
    );
    const fieldsByType = new Map<number, any[]>();
    for (const field of fieldsQ.rows) {
      const list = fieldsByType.get(field.ticket_type_id) ?? [];
      list.push(field);
      fieldsByType.set(field.ticket_type_id, list);
    }

    for (const tt of ttQ.rows) {
      const allowedActions: string[] = [];
      const createPerm = TICKET_CREATE_PERMISSION[tt.code];
      const viewPerm = TICKET_VIEW_PERMISSION[tt.code] ?? P.TRACKING_ACCESS;
      if (createPerm && permissions.includes(createPerm)) allowedActions.push("create");
      if (permissions.includes(viewPerm)) {
        allowedActions.push("view");
      }

      if (allowedActions.length === 0) continue;

      ticketTypes.push({
        code: tt.code,
        name: tt.name,
        description: tt.description,
        allowedActions,
        fields: (fieldsByType.get(tt.id) ?? []).map((f) => ({
          key: f.field_key,
          label: f.label,
          type: f.field_type,
          required: f.is_required,
          defaultValue: f.default_value,
          options: f.options_json,
        })),
      });
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      department: access.department,
      roles,
      permissions,
      ticketTypes,
    };
  },
};
