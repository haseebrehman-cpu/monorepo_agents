import type { Pool, PoolClient } from "pg";
import { pool } from "../../core/db.js";
import type { SendMessageInput, UpdatePresenceInput } from "./desk.schema.js";
import {
  DEFAULT_QUEUE_LIMIT,
  LIVE_CHAT_STATUS,
  RECENT_RESOLVED_LIMIT,
  customerSystemMessages,
  SYSTEM_AUTHOR_NAME,
  systemMessages,
  type LiveChatStatus,
} from "./live-chat.constants.js";
import { publishCustomerEvent, publishDeskEvent, notifyCustomerTyping, type CustomerNotice } from "./live-chat.events.js";
import {
  assignedFrom,
  ELIGIBLE_MEMBERS_FROM,
  eligibleMemberParams,
  lockQueue,
  rebalance,
} from "./live-chat.queue.js";

export type Viewer = {
  userId: number;
  isAdmin: boolean;
  canAssign: boolean;
  departmentId: number | null;
};

export class DeskError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}

const notFound = () => new DeskError(404, "CONVERSATION_NOT_FOUND");
const conflict = (code: string) => new DeskError(409, code);

export type DeskMessage = {
  id: string;
  author: "customer" | "assistant" | "agent" | "system" | "note";
  authorName: string;
  body: string;
  at: string;
};

export type DeskConversation = {
  id: string;
  customerName: string;
  customerEmail: string;
  channel: string;
  orderNumber: string | null;
  status: LiveChatStatus;
  queuedForId: number | null;
  ownerId: number | null;
  handoffReason: string;
  aiSummary: string;
  handedOffAt: string;
  updatedAt: string;
  unread: number;
  tags: string[];
  location: string;
  lastMessage: DeskMessage | null;
  messages?: DeskMessage[];
};

export type DeskMember = {
  id: number;
  name: string;
  role: "admin" | "agent";
  limit: number;
  accepting: boolean;
  queued: number;
  taken: number;
};

/**
 * Everyone sees unassigned waiting chats, waiting chats queued to them, and chats
 * they own. Admins also see chats queued to or owned by members of their own
 * department. A waiting chat never has an owner, so the coalesce picks the
 * person the chat currently sits with.
 * Always placed after `viewerParams`: $1 user id, $2 is admin, $3 department id.
 */
const VISIBLE = `(
  (c.status = 'waiting' AND (c.queued_for_id IS NULL OR c.queued_for_id = $1))
  OR (c.status <> 'waiting' AND c.owner_id = $1)
  OR ($2 AND EXISTS (
    SELECT 1 FROM users du
    WHERE du.id = COALESCE(c.owner_id, c.queued_for_id)
      AND du.department_id IS NOT DISTINCT FROM $3::int
  ))
)`;

const viewerParams = (viewer: Viewer) => [viewer.userId, viewer.isAdmin, viewer.departmentId];

/** Columns for one conversation row. `$1` must be the viewer's user id. */
const CONVERSATION_COLUMNS = `
  c.id, c.customer_name, c.customer_email, c.channel, c.order_number, c.status,
  c.queued_for_id, c.owner_id, c.handoff_reason, c.ai_summary, c.handed_off_at,
  c.updated_at, c.tags, c.location,
  (SELECT count(*)::int
   FROM live_chat_messages um
   WHERE um.conversation_id = c.id
     AND um.author = 'customer'
     AND um.id > COALESCE(r.last_read_message_id, 0)) AS unread,
  lm.id AS last_id, lm.author AS last_author, lm.author_name AS last_author_name,
  lm.body AS last_body, lm.sent_at AS last_sent_at`;

const CONVERSATION_JOINS = `
  LEFT JOIN live_chat_reads r ON r.conversation_id = c.id AND r.user_id = $1
  LEFT JOIN LATERAL (
    SELECT m.id, m.author, m.author_name, m.body, m.sent_at
    FROM live_chat_messages m
    WHERE m.conversation_id = c.id AND m.author <> 'system'
    ORDER BY m.sent_at DESC, m.id DESC
    LIMIT 1
  ) lm ON TRUE`;

function toMessage(row: Record<string, unknown>): DeskMessage {
  return {
    id: String(row.id),
    author: row.author as DeskMessage["author"],
    authorName: row.author_name as string,
    body: row.body as string,
    at: (row.sent_at as Date).toISOString(),
  };
}

async function messageById(id: string): Promise<DeskMessage | null> {
  const { rows } = await pool.query(
    `SELECT id, author, author_name, body, sent_at FROM live_chat_messages WHERE id = $1`,
    [id]
  );
  return rows[0] ? toMessage(rows[0]) : null;
}

function toConversation(row: Record<string, unknown>): DeskConversation {
  return {
    id: row.id as string,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    channel: row.channel as string,
    orderNumber: (row.order_number as string | null) ?? null,
    status: row.status as LiveChatStatus,
    queuedForId: (row.queued_for_id as number | null) ?? null,
    ownerId: (row.owner_id as number | null) ?? null,
    handoffReason: row.handoff_reason as string,
    aiSummary: row.ai_summary as string,
    handedOffAt: (row.handed_off_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    unread: row.unread as number,
    tags: row.tags as string[],
    location: row.location as string,
    lastMessage: row.last_id
      ? toMessage({
          id: row.last_id,
          author: row.last_author,
          author_name: row.last_author_name,
          body: row.last_body,
          sent_at: row.last_sent_at,
        })
      : null,
  };
}

async function actorName(client: PoolClient, userId: number) {
  const { rows } = await client.query(`SELECT name FROM users WHERE id = $1`, [userId]);
  return (rows[0]?.name as string | undefined) ?? "An agent";
}

/** Returns the new message id. */
async function insertMessage(
  client: PoolClient,
  conversationId: string,
  message: {
    author: DeskMessage["author"];
    authorName: string;
    body: string;
    userId?: number;
    customerBody?: string;
  }
): Promise<string> {
  const { rows } = await client.query(
    `WITH inserted AS (
       INSERT INTO live_chat_messages
         (conversation_id, author, author_name, author_user_id, body, customer_body, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, sent_at
     ), touched AS (
       UPDATE live_chat_conversations
       SET updated_at = (SELECT sent_at FROM inserted)
       WHERE id = $1
     )
     SELECT id FROM inserted`,
    [
      conversationId,
      message.author,
      message.authorName,
      message.userId ?? null,
      message.body,
      message.customerBody ?? null,
    ]
  );
  return String(rows[0].id);
}

/** Without `customerBody` the line stays desk-only. */
function systemMessage(client: PoolClient, conversationId: string, body: string, customerBody?: string) {
  return insertMessage(client, conversationId, {
    author: "system",
    authorName: SYSTEM_AUTHOR_NAME,
    body,
    customerBody,
  });
}

/** A status change the customer sees, with its system line. */
async function customerStatusChange(
  client: PoolClient,
  conversationId: string,
  body: string,
  customerBody: string
): Promise<CustomerNotice> {
  const messageId = await systemMessage(client, conversationId, body, customerBody);
  return { conversationId, messageIds: [messageId], status: true };
}

type LockedConversation = {
  id: string;
  externalId: string;
  status: LiveChatStatus;
  queuedForId: number | null;
  ownerId: number | null;
};

/**
 * Runs a desk action in one transaction. The conversation row is locked and
 * must be visible to the viewer. Actions that move chats between members also
 * hold the queue lock and rebalance before commit.
 */
async function withConversation(
  viewer: Viewer,
  conversationId: string,
  options: { queue: boolean },
  action: (client: PoolClient, conversation: LockedConversation) => Promise<CustomerNotice | void>
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (options.queue) await lockQueue(client);
    const { rows } = await client.query(
      `SELECT c.id, c.external_conversation_id, c.status, c.queued_for_id, c.owner_id
       FROM live_chat_conversations c
       WHERE c.id = $4 AND ${VISIBLE}
       FOR UPDATE`,
      [...viewerParams(viewer), conversationId]
    );
    const row = rows[0];
    if (!row) throw notFound();

    const customerNotice = await action(client, {
      id: row.id as string,
      externalId: row.external_conversation_id as string,
      status: row.status as LiveChatStatus,
      queuedForId: (row.queued_for_id as number | null) ?? null,
      ownerId: (row.owner_id as number | null) ?? null,
    });
    if (customerNotice) await publishCustomerEvent(client, customerNotice);

    const changes = options.queue ? await rebalance(client) : new Map<string, number | null>();
    const live = customerNotice?.live === true && customerNotice.messageIds.length > 0 && changes.size === 0;
    await publishDeskEvent(client, live
      ? {
          ids: [conversationId],
          assigned: [],
          queued: [],
          liveMessages: [{ conversationId, messageIds: customerNotice.messageIds }],
        }
      : {
          ids: [...new Set([conversationId, ...changes.keys()])],
          assigned: assignedFrom(changes),
          queued: [],
        });
    await client.query("COMMIT");
    if (live) return messageById(customerNotice.messageIds[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return deskService.getConversation(viewer, conversationId);
}

async function loadMember(userId: number) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name,
            COALESCE(m.queue_limit, $2)::int AS queue_limit,
            COALESCE(m.accepting, TRUE) AS accepting
     FROM users u
     LEFT JOIN live_chat_members m ON m.user_id = u.id
     WHERE u.id = $1`,
    [userId, DEFAULT_QUEUE_LIMIT]
  );
  return rows[0] ?? null;
}

async function updatePresenceAndRebalance(
  userId: number,
  input: { accepting?: boolean; limit?: number }
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await lockQueue(client);
    await client.query(
      `INSERT INTO live_chat_members (user_id, queue_limit, accepting)
       VALUES ($1, COALESCE($2, $4), COALESCE($3, TRUE))
       ON CONFLICT (user_id) DO UPDATE
       SET queue_limit = COALESCE($2, live_chat_members.queue_limit),
           accepting = COALESCE($3, live_chat_members.accepting),
           updated_at = NOW()`,
      [userId, input.limit ?? null, input.accepting ?? null, DEFAULT_QUEUE_LIMIT]
    );
    const changes = await rebalance(client);
    await publishDeskEvent(client, {
      ids: [...changes.keys()],
      assigned: assignedFrom(changes),
      queued: [],
      members: true,
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** An eligible member who works in the given department. */
async function isDepartmentMember(db: Pool | PoolClient, userId: number, departmentId: number | null) {
  const { rows } = await db.query(
    `SELECT 1 ${ELIGIBLE_MEMBERS_FROM}
       AND u.id = $5
       AND u.department_id IS NOT DISTINCT FROM $6::int`,
    [...eligibleMemberParams(), userId, departmentId]
  );
  return rows.length > 0;
}

export const deskService = {
  async getMe(viewer: Viewer) {
    const row = await loadMember(viewer.userId);
    if (!row) throw new DeskError(404, "MEMBER_NOT_FOUND");
    return {
      id: row.id as number,
      name: row.name as string,
      role: viewer.isAdmin ? ("admin" as const) : ("agent" as const),
      limit: row.queue_limit as number,
      accepting: row.accepting as boolean,
      canReceiveChats: await isDepartmentMember(pool, viewer.userId, viewer.departmentId),
    };
  },

  async updateMe(viewer: Viewer, input: UpdatePresenceInput) {
    if (!(await isDepartmentMember(pool, viewer.userId, viewer.departmentId))) {
      throw new DeskError(403, "FORBIDDEN");
    }
    await updatePresenceAndRebalance(viewer.userId, input);
    return this.getMe(viewer);
  },

  /** Members of the viewer's department. */
  async listMembers(viewer: Viewer): Promise<DeskMember[]> {
    const { rows } = await pool.query(
      `SELECT u.id, u.name,
              COALESCE(m.queue_limit, $5)::int AS queue_limit,
              COALESCE(m.accepting, TRUE) AS accepting,
              (SELECT count(*)::int FROM live_chat_conversations c
               WHERE c.status = $6 AND c.queued_for_id = u.id) AS queued,
              (SELECT count(*)::int FROM live_chat_conversations c
               WHERE c.status = $7 AND c.owner_id = u.id) AS taken
       ${ELIGIBLE_MEMBERS_FROM}
         AND u.department_id IS NOT DISTINCT FROM $8::int
       ORDER BY u.name, u.id`,
      [
        ...eligibleMemberParams(),
        DEFAULT_QUEUE_LIMIT,
        LIVE_CHAT_STATUS.WAITING,
        LIVE_CHAT_STATUS.ACTIVE,
        viewer.departmentId,
      ]
    );
    return rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      role: "agent",
      limit: row.queue_limit as number,
      accepting: row.accepting as boolean,
      queued: row.queued as number,
      taken: row.taken as number,
    }));
  },

  async updateMemberLimit(viewer: Viewer, memberId: number, limit: number) {
    if (!(await isDepartmentMember(pool, memberId, viewer.departmentId))) {
      throw new DeskError(404, "MEMBER_NOT_FOUND");
    }
    await updatePresenceAndRebalance(memberId, { limit });
    return (await this.listMembers(viewer)).find((member) => member.id === memberId) ?? null;
  },

  async listConversations(viewer: Viewer) {
    const { rows } = await pool.query(
      `WITH visible AS (
         (SELECT c.id FROM live_chat_conversations c
          WHERE c.status <> 'resolved' AND ${VISIBLE})
         UNION ALL
         (SELECT c.id FROM live_chat_conversations c
          WHERE c.status = 'resolved' AND ${VISIBLE}
          ORDER BY c.updated_at DESC
          LIMIT $4)
       )
       SELECT ${CONVERSATION_COLUMNS}
       FROM visible v
       JOIN live_chat_conversations c ON c.id = v.id
       ${CONVERSATION_JOINS}`,
      [...viewerParams(viewer), RECENT_RESOLVED_LIMIT]
    );
    const { rows: totals } = await pool.query(
      `SELECT count(*)::int AS resolved
       FROM live_chat_conversations c
       WHERE c.status = 'resolved' AND ${VISIBLE}`,
      viewerParams(viewer)
    );
    return {
      items: rows.map(toConversation),
      resolvedTotal: totals[0].resolved as number,
    };
  },

  async getConversation(viewer: Viewer, conversationId: string): Promise<DeskConversation | null> {
    const { rows } = await pool.query(
      `SELECT ${CONVERSATION_COLUMNS}
       FROM live_chat_conversations c
       ${CONVERSATION_JOINS}
       WHERE c.id = $4 AND ${VISIBLE}`,
      [...viewerParams(viewer), conversationId]
    );
    if (!rows[0]) return null;
    const { rows: messages } = await pool.query(
      `SELECT id, author, author_name, body, sent_at
       FROM live_chat_messages
       WHERE conversation_id = $1
       ORDER BY sent_at, id`,
      [conversationId]
    );
    return { ...toConversation(rows[0]), messages: messages.map(toMessage) };
  },

  async markRead(viewer: Viewer, conversationId: string) {
    const { rows } = await pool.query(
      `INSERT INTO live_chat_reads (conversation_id, user_id, last_read_message_id)
       SELECT c.id, $1,
              COALESCE((SELECT max(m.id) FROM live_chat_messages m WHERE m.conversation_id = c.id), 0)
       FROM live_chat_conversations c
       WHERE c.id = $4 AND ${VISIBLE}
       ON CONFLICT (conversation_id, user_id) DO UPDATE
       SET last_read_message_id = GREATEST(
             live_chat_reads.last_read_message_id,
             EXCLUDED.last_read_message_id
           ),
           updated_at = NOW()
       RETURNING conversation_id`,
      [...viewerParams(viewer), conversationId]
    );
    if (!rows[0]) throw notFound();
  },

  take(viewer: Viewer, conversationId: string) {
    return withConversation(viewer, conversationId, { queue: true }, async (client, chat) => {
      const name = await actorName(client, viewer.userId);
      if (chat.status === LIVE_CHAT_STATUS.RESOLVED) throw conflict("CONVERSATION_CLOSED");
      if (chat.status === LIVE_CHAT_STATUS.WAITING) {
        if (chat.queuedForId !== viewer.userId && !viewer.isAdmin) {
          throw conflict("NOT_QUEUED_FOR_YOU");
        }
        await client.query(
          `UPDATE live_chat_conversations
           SET status = 'active', owner_id = $2, queued_for_id = NULL
           WHERE id = $1`,
          [chat.id, viewer.userId]
        );
        return customerStatusChange(
          client,
          chat.id,
          systemMessages.took(name),
          customerSystemMessages.joined(name)
        );
      }
      if (chat.ownerId === viewer.userId) throw conflict("ALREADY_YOURS");
      if (!viewer.isAdmin) throw conflict("ALREADY_TAKEN");
      const previous = chat.ownerId === null ? "another agent" : await actorName(client, chat.ownerId);
      await client.query(`UPDATE live_chat_conversations SET owner_id = $2 WHERE id = $1`, [
        chat.id,
        viewer.userId,
      ]);
      return customerStatusChange(
        client,
        chat.id,
        systemMessages.tookOver(name, previous),
        customerSystemMessages.joined(name)
      );
    });
  },

  transfer(viewer: Viewer, conversationId: string, memberId: number) {
    return withConversation(viewer, conversationId, { queue: true }, async (client, chat) => {
      if (chat.status !== LIVE_CHAT_STATUS.ACTIVE || chat.ownerId !== viewer.userId) {
        throw conflict("NOT_OWNER");
      }
      if (memberId === viewer.userId || !(await isDepartmentMember(client, memberId, viewer.departmentId))) {
        throw new DeskError(400, "INVALID_TRANSFER_TARGET");
      }
      const name = await actorName(client, viewer.userId);
      const target = await actorName(client, memberId);
      await client.query(`UPDATE live_chat_conversations SET owner_id = $2 WHERE id = $1`, [
        chat.id,
        memberId,
      ]);
      return customerStatusChange(
        client,
        chat.id,
        systemMessages.transferred(name, target),
        customerSystemMessages.transferred(target)
      );
    });
  },

  resolve(viewer: Viewer, conversationId: string) {
    return withConversation(viewer, conversationId, { queue: true }, async (client, chat) => {
      if (chat.status !== LIVE_CHAT_STATUS.ACTIVE || chat.ownerId !== viewer.userId) {
        throw conflict("NOT_OWNER");
      }
      await client.query(
        `UPDATE live_chat_conversations SET status = 'resolved', resolved_at = NOW() WHERE id = $1`,
        [chat.id]
      );
      return customerStatusChange(
        client,
        chat.id,
        systemMessages.closed(await actorName(client, viewer.userId)),
        customerSystemMessages.closed
      );
    });
  },

  reopen(viewer: Viewer, conversationId: string) {
    return withConversation(viewer, conversationId, { queue: true }, async (client, chat) => {
      if (chat.status !== LIVE_CHAT_STATUS.RESOLVED || chat.ownerId !== viewer.userId) {
        throw conflict("NOT_OWNER");
      }
      const { rows } = await client.query(
        `SELECT 1 FROM live_chat_conversations
         WHERE external_conversation_id = $1 AND status <> 'resolved'`,
        [chat.externalId]
      );
      if (rows.length > 0) throw conflict("CUSTOMER_HAS_OPEN_CHAT");
      await client.query(
        `UPDATE live_chat_conversations SET status = 'active', resolved_at = NULL WHERE id = $1`,
        [chat.id]
      );
      const name = await actorName(client, viewer.userId);
      return customerStatusChange(
        client,
        chat.id,
        systemMessages.reopened(name),
        customerSystemMessages.reopened(name)
      );
    });
  },

  sendMessage(viewer: Viewer, conversationId: string, input: SendMessageInput) {
    return withConversation(viewer, conversationId, { queue: false }, async (client, chat) => {
      if (chat.status === LIVE_CHAT_STATUS.RESOLVED) throw conflict("CONVERSATION_CLOSED");
      if (input.kind === "reply" && (chat.status !== LIVE_CHAT_STATUS.ACTIVE || chat.ownerId !== viewer.userId)) {
        throw conflict("NOT_OWNER");
      }
      const messageId = await insertMessage(client, chat.id, {
        author: input.kind === "note" ? "note" : "agent",
        authorName: await actorName(client, viewer.userId),
        body: input.body,
        userId: viewer.userId,
      });
      return {
        conversationId: chat.id,
        messageIds: [messageId],
        status: false,
        live: true,
        customerVisible: input.kind !== "note",
      };
    });
  },

  async setTyping(viewer: Viewer, conversationId: string, typing: boolean) {
    const { rows } = await pool.query(
      `SELECT 1 FROM live_chat_conversations c WHERE c.id = $4 AND ${VISIBLE}`,
      [...viewerParams(viewer), conversationId]
    );
    if (!rows[0]) throw notFound();
    await notifyCustomerTyping(conversationId, typing);
  },
};
