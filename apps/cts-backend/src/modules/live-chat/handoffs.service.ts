import type { PoolClient } from "pg";
import { pool } from "../../core/db.js";
import type { CreateHandoffInput } from "./handoffs.schema.js";
import {
  handoffSystemMessage,
  LIVE_CHAT_STATUS,
  SYSTEM_AUTHOR_NAME,
  type LiveChatStatus,
} from "./live-chat.constants.js";
import { publishDeskEvent } from "./live-chat.events.js";
import { assignedFrom, lockQueue, rebalance } from "./live-chat.queue.js";

export type HandoffResult = {
  id: string;
  conversationId: string;
  status: LiveChatStatus;
  queuedFor: { id: number; name: string } | null;
  handedOffAt: string;
};

async function insertConversation(client: PoolClient, input: CreateHandoffInput) {
  const { rows } = await client.query(
    `INSERT INTO live_chat_conversations (
       external_conversation_id, customer_name, customer_email, channel, order_number,
       handoff_reason, ai_summary, tags, location
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (external_conversation_id) WHERE status <> 'resolved' DO NOTHING
     RETURNING id, handed_off_at`,
    [
      input.conversationId,
      input.customerName,
      input.customerEmail,
      input.channel,
      input.orderNumber,
      input.handoffReason,
      input.aiSummary,
      input.tags,
      input.location,
    ]
  );
  const row = rows[0];
  if (!row) return null;
  return { id: row.id as string, handedOffAt: row.handed_off_at as Date };
}

async function findOpenConversation(
  client: PoolClient,
  externalId: string
): Promise<HandoffResult | null> {
  const { rows } = await client.query(
    `SELECT c.id, c.external_conversation_id, c.status, c.handed_off_at,
            q.id AS queued_for_id, q.name AS queued_for_name
     FROM live_chat_conversations c
     LEFT JOIN users q ON q.id = c.queued_for_id
     WHERE c.external_conversation_id = $1
       AND c.status <> $2`,
    [externalId, LIVE_CHAT_STATUS.RESOLVED]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id as string,
    conversationId: row.external_conversation_id as string,
    status: row.status as LiveChatStatus,
    queuedFor: row.queued_for_id
      ? { id: row.queued_for_id as number, name: row.queued_for_name as string }
      : null,
    handedOffAt: (row.handed_off_at as Date).toISOString(),
  };
}

/** The transcript arrives later. This records only why the chat was handed off. */
async function insertHandoffNote(
  client: PoolClient,
  conversationId: string,
  handedOffAt: Date,
  reason: string
) {
  await client.query(
    `INSERT INTO live_chat_messages (conversation_id, author, author_name, body, sent_at)
     VALUES ($1, 'system', $2, $3, $4)`,
    [conversationId, SYSTEM_AUTHOR_NAME, handoffSystemMessage(reason), handedOffAt]
  );
}

export const handoffsService = {
  /** Creates a waiting conversation and places it. Repeating an open handoff returns it unchanged. */
  async create(input: CreateHandoffInput): Promise<{ created: boolean; handoff: HandoffResult }> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await lockQueue(client);

      const inserted = await insertConversation(client, input);
      if (!inserted) {
        const existing = await findOpenConversation(client, input.conversationId);
        if (!existing) throw new Error("HANDOFF_CONFLICT_NOT_FOUND");
        await client.query("COMMIT");
        return { created: false, handoff: existing };
      }

      await insertHandoffNote(client, inserted.id, inserted.handedOffAt, input.handoffReason);
      const changes = await rebalance(client);
      const handoff = await findOpenConversation(client, input.conversationId);
      if (!handoff) throw new Error("HANDOFF_NOT_FOUND");
      await publishDeskEvent(client, {
        ids: [...new Set([inserted.id, ...changes.keys()])],
        assigned: assignedFrom(changes),
        queued: handoff.queuedFor ? [] : [inserted.id],
      });
      await client.query("COMMIT");
      return { created: true, handoff };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
