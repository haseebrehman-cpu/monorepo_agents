import { pool } from "../../core/db.js";
import type { CustomerMessageInput } from "./customer.schema.js";
import {
  CUSTOMER_REPLAY_LIMIT,
  customerFacingName,
  LIVE_CHAT_STATUS,
  type LiveChatStatus,
} from "./live-chat.constants.js";
import { issueCustomerToken } from "./customer-token.js";
import { publishCustomerEvent, publishDeskEvent } from "./live-chat.events.js";

export type CustomerMessage = {
  id: string;
  author: "customer" | "agent" | "system";
  authorName: string;
  body: string;
  at: string;
  /** Echoes the browser's id so it can swap its pending bubble for this one. */
  clientId: string | null;
};

export type CustomerStatus = {
  status: LiveChatStatus;
  /** First name of the agent who owns the chat, while it is active. */
  agentName: string | null;
};

export class CustomerChatError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}

/** Notes, AI turns, and desk-only system lines never reach the customer. */
const VISIBLE_TO_CUSTOMER = `(m.author IN ('customer', 'agent')
  OR (m.author = 'system' AND m.customer_body IS NOT NULL))`;

const MESSAGE_COLUMNS = `m.id, m.author, m.author_name,
  COALESCE(m.customer_body, m.body) AS body, m.sent_at, m.client_message_id`;

function toCustomerMessage(row: Record<string, unknown>): CustomerMessage {
  const author = row.author as CustomerMessage["author"];
  const authorName = row.author_name as string;
  return {
    id: String(row.id),
    author,
    authorName: author === "agent" ? customerFacingName(authorName) : authorName,
    body: row.body as string,
    at: (row.sent_at as Date).toISOString(),
    clientId: (row.client_message_id as string | null) ?? null,
  };
}

export const customerChatService = {
  /** A token for an existing desk conversation, or null when that id is unknown. */
  async issueToken(conversationId: string): Promise<string | null> {
    const { rows } = await pool.query(`SELECT 1 FROM live_chat_conversations WHERE id = $1`, [
      conversationId,
    ]);
    if (!rows[0]) return null;
    return issueCustomerToken(conversationId);
  },

  async status(conversationId: string): Promise<CustomerStatus | null> {
    const { rows } = await pool.query(
      `SELECT c.status, u.name AS owner_name
       FROM live_chat_conversations c
       LEFT JOIN users u ON u.id = c.owner_id
       WHERE c.id = $1`,
      [conversationId]
    );
    const row = rows[0];
    if (!row) return null;
    const status = row.status as LiveChatStatus;
    const ownerName = row.owner_name as string | null;
    return {
      status,
      agentName:
        status === LIVE_CHAT_STATUS.ACTIVE && ownerName ? customerFacingName(ownerName) : null,
    };
  },

  /** Oldest first. With a cursor, the messages after it. Without one, the latest page. */
  async messages(conversationId: string, afterId: string | null): Promise<CustomerMessage[]> {
    const { rows } = afterId
      ? await pool.query(
          `SELECT ${MESSAGE_COLUMNS}
           FROM live_chat_messages m
           WHERE m.conversation_id = $1 AND m.id > $2 AND ${VISIBLE_TO_CUSTOMER}
           ORDER BY m.id
           LIMIT $3`,
          [conversationId, afterId, CUSTOMER_REPLAY_LIMIT]
        )
      : await pool.query(
          `SELECT * FROM (
             SELECT ${MESSAGE_COLUMNS}
             FROM live_chat_messages m
             WHERE m.conversation_id = $1 AND ${VISIBLE_TO_CUSTOMER}
             ORDER BY m.id DESC
             LIMIT $2
           ) recent
           ORDER BY id`,
          [conversationId, CUSTOMER_REPLAY_LIMIT]
        );
    return rows.map(toCustomerMessage);
  },

  async messagesByIds(conversationId: string, ids: string[]): Promise<CustomerMessage[]> {
    if (ids.length === 0) return [];
    const { rows } = await pool.query(
      `SELECT ${MESSAGE_COLUMNS}
       FROM live_chat_messages m
       WHERE m.conversation_id = $1 AND m.id = ANY($2::bigint[]) AND ${VISIBLE_TO_CUSTOMER}
       ORDER BY m.id`,
      [conversationId, ids]
    );
    return rows.map(toCustomerMessage);
  },

  /** Allowed while waiting or active. A retry with the same client id returns the stored message. */
  async send(conversationId: string, input: CustomerMessageInput): Promise<CustomerMessage> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Every writer locks the conversation row before inserting, so message ids
      // commit in order within a conversation and a stream cursor never skips one.
      const { rows } = await client.query(
        `SELECT status, customer_name FROM live_chat_conversations WHERE id = $1 FOR UPDATE`,
        [conversationId]
      );
      const conversation = rows[0];
      if (!conversation) throw new CustomerChatError(404, "CONVERSATION_NOT_FOUND");
      if (conversation.status === LIVE_CHAT_STATUS.RESOLVED) {
        throw new CustomerChatError(409, "CONVERSATION_CLOSED");
      }

      const inserted = await client.query(
        `INSERT INTO live_chat_messages
           (conversation_id, author, author_name, body, client_message_id, sent_at)
         VALUES ($1, 'customer', $2, $3, $4, NOW())
         ON CONFLICT (conversation_id, client_message_id) WHERE client_message_id IS NOT NULL
         DO NOTHING
         RETURNING id, author, author_name, body, sent_at, client_message_id`,
        [conversationId, conversation.customer_name, input.body, input.clientId]
      );

      if (!inserted.rows[0]) {
        const { rows: existing } = await client.query(
          `SELECT ${MESSAGE_COLUMNS}
           FROM live_chat_messages m
           WHERE m.conversation_id = $1 AND m.client_message_id = $2`,
          [conversationId, input.clientId]
        );
        await client.query("COMMIT");
        return toCustomerMessage(existing[0]);
      }

      const message = toCustomerMessage(inserted.rows[0]);
      await client.query(`UPDATE live_chat_conversations SET updated_at = $2 WHERE id = $1`, [
        conversationId,
        message.at,
      ]);
      await publishDeskEvent(client, {
        ids: [conversationId],
        assigned: [],
        queued: [],
        liveMessages: [{ conversationId, messageIds: [message.id] }],
      });
      await publishCustomerEvent(client, {
        conversationId,
        messageIds: [message.id],
        status: false,
      });
      await client.query("COMMIT");
      return message;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
