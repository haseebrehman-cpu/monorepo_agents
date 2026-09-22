import { pool } from "../../core/db.js";
import { ticketLookupsService } from "../ticket-lookups/ticket-lookups.service.js";
import type {
  CreateReplyInput,
  CreateTicketInput,
  TicketListFilters,
} from "./tickets.schema.js";
import type {
  BulkTicketError,
  BulkTicketRow,
} from "./tickets-bulk.parser.js";

export type TicketAttachmentInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileData: Buffer;
};

const TICKET_SELECT = `
  SELECT
    t.id,
    t.ticket_number,
    t.order_id,
    t.courier,
    t.tracking_number,
    t.issue,
    t.status,
    t.comment_html,
    t.created_at,
    t.updated_at,
    t.closed_at,
    t.assigned_department_id,
    COALESCE(assigned_dept.name, 'Unassigned') AS assigned_to,
    COALESCE(created.name, 'Deleted user') AS created_by,
    created_dept.name AS created_by_department,
    COALESCE(modified.name, '') AS modified_by,
    COALESCE(closed.name, '') AS closed_by,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', a.id,
            'fileName', a.file_name,
            'mimeType', a.mime_type,
            'sizeBytes', a.size_bytes
          )
          ORDER BY a.id
        )
        FROM ticket_attachments a
        WHERE a.ticket_id = t.id AND a.reply_id IS NULL
      ),
      '[]'
    ) AS attachments
  FROM tickets t
  LEFT JOIN departments assigned_dept ON assigned_dept.id = t.assigned_department_id
  LEFT JOIN users created ON created.id = t.created_by_id
  LEFT JOIN departments created_dept ON created_dept.id = created.department_id
  LEFT JOIN users modified ON modified.id = t.modified_by_id
  LEFT JOIN users closed ON closed.id = t.closed_by_id
`;

function mapTicket(row: Record<string, unknown>) {
  return {
    id: row.ticket_number as string,
    dbId: row.id as number,
    orderId: row.order_id as string,
    courier: row.courier as string,
    trackingNumber: row.tracking_number as string,
    issue: row.issue as string,
    status: row.status as string,
    comment: row.comment_html as string,
    ticketDate: row.created_at,
    assignedTo: row.assigned_to as string,
    assignedDepartmentId: (row.assigned_department_id as number | null) ?? null,
    createdBy: row.created_by as string,
    createdByDepartment: (row.created_by_department as string | null) ?? null,
    modifiedBy: row.modified_by as string,
    closedBy: row.closed_by as string,
    closedAt: row.closed_at,
    updatedAt: row.updated_at,
    attachments: parseJsonArray(row.attachments),
  };
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function isTicketNumber(ref: string) {
  return !/^\d+$/.test(ref);
}

async function findTicketRow(ticketRef: string) {
  const sql = isTicketNumber(ticketRef)
    ? `${TICKET_SELECT} WHERE t.ticket_number = $1`
    : `${TICKET_SELECT} WHERE t.id = $1`;
  const value = isTicketNumber(ticketRef) ? ticketRef : Number(ticketRef);
  const { rows } = await pool.query(sql, [value]);
  return rows[0] ? mapTicket(rows[0]) : null;
}

function buildListQuery(filters: TicketListFilters = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addEquals = (column: string, value: string | undefined) => {
    if (!value) return;
    values.push(value);
    conditions.push(`${column} = $${values.length}`);
  };

  addEquals("t.courier", filters.courier);
  addEquals("t.issue", filters.issue);
  addEquals("t.status", filters.status);
  addEquals("created.name", filters.createdBy);
  addEquals("modified.name", filters.modifiedBy);

  if (filters.assignedTo === "Unassigned") {
    conditions.push("t.assigned_department_id IS NULL");
  } else {
    addEquals("assigned_dept.name", filters.assignedTo);
  }

  if (filters.fromDate) {
    values.push(filters.fromDate);
    conditions.push(`t.created_at >= $${values.length}::date`);
  }

  if (filters.toDate) {
    values.push(filters.toDate);
    conditions.push(`t.created_at < ($${values.length}::date + INTERVAL '1 day')`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return {
    sql: `${TICKET_SELECT} ${where} ORDER BY t.created_at DESC`,
    values,
  };
}

const ATTACHMENT_JSON = `
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'fileName', a.file_name,
          'mimeType', a.mime_type,
          'sizeBytes', a.size_bytes
        )
        ORDER BY a.id
      )
      FROM ticket_attachments a
      WHERE a.reply_id = r.id
    ),
    '[]'
  )
`;

async function loadHistory(ticket: ReturnType<typeof mapTicket>) {
  const [replies, events] = await Promise.all([
    pool.query(
      `SELECT
         r.id,
         r.body_html,
         r.created_at,
         r.assigned_department_id,
         COALESCE(author.name, 'Deleted user') AS author_name,
         author_dept.name AS author_department,
         assigned_dept.name AS assigned_to_name,
         ${ATTACHMENT_JSON} AS attachments
       FROM ticket_replies r
       LEFT JOIN users author ON author.id = r.created_by_id
       LEFT JOIN departments author_dept ON author_dept.id = author.department_id
       LEFT JOIN departments assigned_dept ON assigned_dept.id = r.assigned_department_id
       WHERE r.ticket_id = $1
       ORDER BY r.created_at ASC, r.id ASC`,
      [ticket.dbId]
    ),
    pool.query(
      `SELECT
         e.id,
         e.event_type,
         e.from_value,
         e.to_value,
         e.created_at,
         COALESCE(actor.name, 'Deleted user') AS author_name,
         actor_dept.name AS author_department,
         assigned_dept.name AS assigned_to_name
       FROM ticket_events e
       LEFT JOIN users actor ON actor.id = e.actor_id
       LEFT JOIN departments actor_dept ON actor_dept.id = actor.department_id
       LEFT JOIN departments assigned_dept ON assigned_dept.id = e.assigned_department_id
       WHERE e.ticket_id = $1
       ORDER BY e.created_at ASC, e.id ASC`,
      [ticket.dbId]
    ),
  ]);

  const history = [
    ...events.rows.map((row) => {
      const kind = row.event_type === "created" ? ("created" as const) : ("status" as const);
      return {
        id: `${kind}-${row.id}`,
        kind,
        authorName: row.author_name as string,
        authorDepartment: (row.author_department as string | null) ?? null,
        assignedToName:
          kind === "created"
            ? ((row.assigned_to_name as string | null) ?? "Unassigned")
            : null,
        assignedToDepartment: null,
        bodyHtml: kind === "created" ? ticket.comment ?? "" : "",
        fromStatus: (row.from_value as string | null) ?? null,
        toStatus: (row.to_value as string | null) ?? null,
        createdAt: row.created_at,
        attachments: kind === "created" ? ticket.attachments : [],
      };
    }),
    ...replies.rows.map((row) => ({
      id: `reply-${row.id}`,
      kind: "reply" as const,
      authorName: row.author_name as string,
      authorDepartment: (row.author_department as string | null) ?? null,
      assignedToName: (row.assigned_to_name as string | null) ?? "Unassigned",
      assignedToDepartment: null,
      bodyHtml: row.body_html as string,
      fromStatus: null,
      toStatus: null,
      createdAt: row.created_at,
      attachments: parseJsonArray(row.attachments),
    })),
  ];

  if (!history.some((item) => item.kind === "created")) {
    history.unshift({
      id: `created-${ticket.dbId}`,
      kind: "created",
      authorName: ticket.createdBy,
      authorDepartment: ticket.createdByDepartment,
      assignedToName: ticket.assignedTo,
      assignedToDepartment: null,
      bodyHtml: ticket.comment ?? "",
      fromStatus: null,
      toStatus: ticket.status,
      createdAt: ticket.ticketDate,
      attachments: ticket.attachments,
    });
  }

  history.sort((a, b) => {
    const aTime = new Date(a.createdAt as string).getTime();
    const bTime = new Date(b.createdAt as string).getTime();
    if (aTime !== bTime) return aTime - bTime;
    const rank = { created: 0, reply: 1, status: 2 };
    return rank[a.kind] - rank[b.kind];
  });

  return history;
}

async function insertAttachments(
  client: { query: typeof pool.query },
  ticketId: number,
  attachments: TicketAttachmentInput[],
  replyId: number | null = null
) {
  for (const file of attachments) {
    await client.query(
      `INSERT INTO ticket_attachments (ticket_id, reply_id, file_name, mime_type, size_bytes, file_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [ticketId, replyId, file.fileName, file.mimeType, file.sizeBytes, file.fileData]
    );
  }
}

type ResolvedTicketInput = CreateTicketInput & {
  courier: string;
  issue: string;
  status: string;
  isClosed: boolean;
};

export class BulkTicketValidationError extends Error {
  constructor(readonly details: BulkTicketError[]) {
    super("BULK_VALIDATION_FAILED");
    this.name = "BulkTicketValidationError";
  }
}

function ticketUniqueError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const databaseError = error as { code?: string; constraint?: string };
  if (databaseError.code !== "23505") return null;
  if (databaseError.constraint === "uniq_tickets_order_id_ci") {
    return "ORDER_ID_ALREADY_EXISTS";
  }
  if (databaseError.constraint === "uniq_tickets_tracking_number_ci") {
    return "TRACKING_NUMBER_ALREADY_EXISTS";
  }
  return null;
}

async function insertTicket(
  client: { query: typeof pool.query },
  input: ResolvedTicketInput,
  createdById: number
) {
  const closedById = input.isClosed ? createdById : null;
  const closedAt = input.isClosed ? new Date() : null;
  const { rows } = await client.query(
    `INSERT INTO tickets (
       order_id,
       courier,
       tracking_number,
       issue,
       status,
       comment_html,
       assigned_department_id,
       created_by_id,
       modified_by_id,
       closed_by_id,
       closed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10)
     RETURNING id`,
    [
      input.orderId,
      input.courier,
      input.trackingNumber,
      input.issue,
      input.status,
      input.comment ?? "",
      input.assignedDepartmentId,
      createdById,
      closedById,
      closedAt,
    ]
  );
  const ticketId = rows[0].id as number;
  await client.query(
    `INSERT INTO ticket_events (ticket_id, event_type, actor_id, assigned_department_id, to_value)
     VALUES ($1, 'created', $2, $3, $4)`,
    [ticketId, createdById, input.assignedDepartmentId, input.status]
  );
  return ticketId;
}

export const ticketsService = {
  async list(filters: TicketListFilters = {}) {
    const { sql, values } = buildListQuery(filters);
    const { rows } = await pool.query(sql, values);
    return rows.map(mapTicket);
  },

  async getById(id: number) {
    const { rows } = await pool.query(`${TICKET_SELECT} WHERE t.id = $1`, [id]);
    return rows[0] ? mapTicket(rows[0]) : null;
  },

  async getByRef(ticketRef: string) {
    const ticket = await findTicketRow(ticketRef);
    if (!ticket) return null;
    const history = await loadHistory(ticket);
    return { ...ticket, history };
  },

  async options() {
    const [departments, users, lookups] = await Promise.all([
      pool.query(`SELECT id, name FROM departments ORDER BY name`),
      pool.query(
        `SELECT u.id, u.name, u.email, d.name AS department
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.is_active = TRUE
         ORDER BY u.name`
      ),
      ticketLookupsService.listActiveByKind(),
    ]);

    return {
      couriers: lookups.couriers,
      issues: lookups.issues,
      statuses: lookups.statuses,
      departments: departments.rows,
      users: users.rows,
    };
  },

  async create(
    input: CreateTicketInput,
    createdById: number,
    attachments: TicketAttachmentInput[]
  ) {
    if (input.assignedDepartmentId) {
      await assertDepartment(input.assignedDepartmentId);
    }

    const courier = await ticketLookupsService.assertActive("courier", input.courier);
    const issue = await ticketLookupsService.assertActive("issue", input.issue);
    const status = await ticketLookupsService.assertActive("status", input.status);
    const resolvedInput: ResolvedTicketInput = {
      ...input,
      courier: courier.label,
      issue: issue.label,
      status: status.label,
      isClosed: status.isClosed,
    };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const ticketId = await insertTicket(client, resolvedInput, createdById);
      await insertAttachments(client, ticketId, attachments);
      await client.query("COMMIT");
      return this.getById(ticketId);
    } catch (error) {
      await client.query("ROLLBACK");
      const uniqueError = ticketUniqueError(error);
      if (uniqueError) throw new Error(uniqueError);
      throw error;
    } finally {
      client.release();
    }
  },

  async bulkCreate(rows: BulkTicketRow[], createdById: number) {
    const orderKeys = rows.map((row) => row.input.orderId.toLowerCase());
    const trackingKeys = rows.map((row) => row.input.trackingNumber.toLowerCase());
    const [
      lookups,
      departmentsResult,
      existingOrdersResult,
      existingTrackingResult,
    ] = await Promise.all([
      ticketLookupsService.listActiveByKind(),
      pool.query(`SELECT id, name FROM departments`),
      pool.query(
        `SELECT lower(btrim(order_id)) AS value
         FROM tickets
         WHERE lower(btrim(order_id)) = ANY($1::text[])`,
        [orderKeys]
      ),
      pool.query(
        `SELECT lower(btrim(tracking_number)) AS value
         FROM tickets
         WHERE lower(btrim(tracking_number)) = ANY($1::text[])`,
        [trackingKeys]
      ),
    ]);
    const canonical = (values: string[]) =>
      new Map(values.map((value) => [value.toLowerCase(), value]));
    const couriers = canonical(lookups.couriers);
    const issues = canonical(lookups.issues);
    const statuses = canonical(lookups.statuses);
    const closedStatuses = new Set(
      [...lookups.closedStatuses].map((value) => value.toLowerCase())
    );
    const departmentIds = new Set<number>(
      departmentsResult.rows.map((row) => Number(row.id))
    );
    const departmentsByName = new Map<string, number>(
      departmentsResult.rows.map((row) => [
        String(row.name).trim().toLowerCase(),
        Number(row.id),
      ])
    );
    const existingOrderIds = new Set<string>(
      existingOrdersResult.rows.map((row) => String(row.value))
    );
    const existingTrackingNumbers = new Set<string>(
      existingTrackingResult.rows.map((row) => String(row.value))
    );
    const errors: BulkTicketError[] = [];
    const resolvedRows: ResolvedTicketInput[] = [];

    for (const row of rows) {
      const courier = couriers.get(row.input.courier.toLowerCase());
      const issue = issues.get(row.input.issue.toLowerCase());
      const requestedStatus =
        row.input.status.toLowerCase() === "open"
          ? "not started"
          : row.input.status.toLowerCase();
      const status = statuses.get(requestedStatus);
      const departmentIdFromName = row.assignedDepartmentName
        ? departmentsByName.get(row.assignedDepartmentName.toLowerCase())
        : undefined;
      const resolvedDepartmentId =
        departmentIdFromName ?? row.input.assignedDepartmentId;
      let departmentIsValid = true;
      let identifiersAreUnique = true;
      if (existingOrderIds.has(row.input.orderId.toLowerCase())) {
        identifiersAreUnique = false;
        errors.push({
          row: row.rowNumber,
          field: "orderId",
          message: "Order ID already exists",
        });
      }
      if (existingTrackingNumbers.has(row.input.trackingNumber.toLowerCase())) {
        identifiersAreUnique = false;
        errors.push({
          row: row.rowNumber,
          field: "trackingNumber",
          message: "Tracking number already exists",
        });
      }
      if (!courier) {
        errors.push({ row: row.rowNumber, field: "courier", message: "Invalid courier" });
      }
      if (!issue) {
        errors.push({ row: row.rowNumber, field: "issue", message: "Invalid issue" });
      }
      if (!status) {
        errors.push({ row: row.rowNumber, field: "status", message: "Invalid status" });
      }
      if (row.assignedDepartmentName && !departmentIdFromName) {
        departmentIsValid = false;
        errors.push({
          row: row.rowNumber,
          field: "assignedDepartment",
          message: "Invalid department name",
        });
      } else if (resolvedDepartmentId && !departmentIds.has(resolvedDepartmentId)) {
        departmentIsValid = false;
        errors.push({
          row: row.rowNumber,
          field: "assignedDepartmentId",
          message: "Invalid department",
        });
      }
      if (courier && issue && status && departmentIsValid && identifiersAreUnique) {
        resolvedRows.push({
          ...row.input,
          courier,
          issue,
          status,
          assignedDepartmentId: resolvedDepartmentId ?? null,
          isClosed: closedStatuses.has(status.toLowerCase()),
        });
      }
    }

    if (errors.length) {
      throw new BulkTicketValidationError(errors);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const input of resolvedRows) {
        await insertTicket(client, input, createdById);
      }
      await client.query("COMMIT");
      return { totalRows: rows.length, createdCount: resolvedRows.length };
    } catch (error) {
      await client.query("ROLLBACK");
      const uniqueError = ticketUniqueError(error);
      if (uniqueError) throw new Error(uniqueError);
      throw error;
    } finally {
      client.release();
    }
  },

  async updateStatus(ticketRef: string, statusLabel: string, actorId: number) {
    const ticket = await findTicketRow(ticketRef);
    if (!ticket) return null;

    const status = await ticketLookupsService.assertActive("status", statusLabel);
    if (ticket.status === status.label) {
      return ticket;
    }

    const closedById = status.isClosed ? actorId : null;
    const closedAt = status.isClosed ? new Date() : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE tickets
         SET status = $2,
             modified_by_id = $3,
             closed_by_id = $4,
             closed_at = $5,
             updated_at = NOW()
         WHERE id = $1`,
        [ticket.dbId, status.label, actorId, closedById, closedAt]
      );
      await client.query(
        `INSERT INTO ticket_events (ticket_id, event_type, actor_id, assigned_department_id, from_value, to_value)
         VALUES ($1, 'status_changed', $2, $3, $4, $5)`,
        [ticket.dbId, actorId, ticket.assignedDepartmentId, ticket.status, status.label]
      );
      await client.query("COMMIT");
      return this.getById(ticket.dbId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async addReply(
    ticketRef: string,
    input: CreateReplyInput,
    createdById: number,
    attachments: TicketAttachmentInput[]
  ) {
    const ticket = await findTicketRow(ticketRef);
    if (!ticket) return null;

    await assertDepartment(input.assignedDepartmentId);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO ticket_replies (ticket_id, body_html, assigned_department_id, created_by_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [ticket.dbId, input.comment, input.assignedDepartmentId, createdById]
      );
      const replyId = rows[0].id as number;
      await insertAttachments(client, ticket.dbId, attachments, replyId);
      await client.query(
        `UPDATE tickets
         SET assigned_department_id = $2,
             modified_by_id = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [ticket.dbId, input.assignedDepartmentId, createdById]
      );
      await client.query("COMMIT");
      return this.getByRef(ticket.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getAttachment(attachmentId: number) {
    const { rows } = await pool.query(
      `SELECT id, ticket_id, file_name, mime_type, size_bytes, file_data
       FROM ticket_attachments
       WHERE id = $1`,
      [attachmentId]
    );
    return rows[0] ?? null;
  },

  async remove(ticketRef: string) {
    const sql = isTicketNumber(ticketRef)
      ? `DELETE FROM tickets WHERE ticket_number = $1 RETURNING id`
      : `DELETE FROM tickets WHERE id = $1 RETURNING id`;
    const value = isTicketNumber(ticketRef) ? ticketRef : Number(ticketRef);
    const { rowCount } = await pool.query(sql, [value]);
    return (rowCount ?? 0) > 0;
  },
};

async function assertDepartment(departmentId: number) {
  const { rows } = await pool.query(`SELECT id FROM departments WHERE id = $1`, [
    departmentId,
  ]);
  if (!rows.length) throw new Error("DEPARTMENT_NOT_FOUND");
}
