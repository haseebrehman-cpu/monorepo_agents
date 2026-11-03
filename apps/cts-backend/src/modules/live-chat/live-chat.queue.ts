import type { PoolClient } from "pg";
import { P, ROLE } from "../../config/features.js";
import { CHATBOT_SERVICE_EMAIL } from "../../core/service-account.js";
import {
  DEFAULT_QUEUE_LIMIT,
  LIVE_CHAT_STATUS,
  PLACEMENT_LOCK_KEY,
} from "./live-chat.constants.js";
import { rebalanceQueue } from "./placement.js";

const hasRole = (code: string) => `EXISTS (
  SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = u.id AND r.code = ${code}
)`;

/**
 * Users who can own live chats: active users granted `live_chat.assign`.
 * Department admins oversee the desk but are not team members, so they never
 * qualify, and neither does a super admin or the chatbot service account.
 * One row per user. Exposes `u` (users) and `m` (live_chat_members, nullable).
 * Parameters $1..$4 are taken by `eligibleMemberParams`.
 */
export const ELIGIBLE_MEMBERS_FROM = `
  FROM users u
  LEFT JOIN live_chat_members m ON m.user_id = u.id
  WHERE u.is_active
    AND lower(u.email) <> $1
    AND NOT ${hasRole("$2")}
    AND NOT ${hasRole("$3")}
    AND EXISTS (
      SELECT 1
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      WHERE up.user_id = u.id AND p.code = $4
    )`;

export const eligibleMemberParams = () => [
  CHATBOT_SERVICE_EMAIL,
  ROLE.SUPER_ADMIN,
  ROLE.ADMIN,
  P.LIVE_CHAT_ASSIGN,
];

/** Serialises every change to queue placement. Hold it for the whole transaction. */
export async function lockQueue(client: PoolClient) {
  await client.query("SELECT pg_advisory_xact_lock($1)", [PLACEMENT_LOCK_KEY]);
}

async function loadAcceptingMembers(client: PoolClient) {
  const { rows } = await client.query(
    `SELECT u.id, u.name,
            COALESCE(m.queue_limit, $5)::int AS queue_limit,
            (SELECT count(*)::int
             FROM live_chat_conversations c
             WHERE c.status = $6 AND c.owner_id = u.id) AS owned
     ${ELIGIBLE_MEMBERS_FROM}
       AND COALESCE(m.accepting, TRUE)`,
    [...eligibleMemberParams(), DEFAULT_QUEUE_LIMIT, LIVE_CHAT_STATUS.ACTIVE]
  );
  return rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    limit: row.queue_limit as number,
    owned: row.owned as number,
  }));
}

/**
 * Re-places every waiting chat and writes the changes in one statement.
 * Call with the queue lock held. Returns the chats whose `queuedForId` changed.
 */
export async function rebalance(client: PoolClient): Promise<Map<string, number | null>> {
  const members = await loadAcceptingMembers(client);
  const { rows } = await client.query(
    `SELECT id, queued_for_id
     FROM live_chat_conversations
     WHERE status = $1
     ORDER BY handed_off_at, id`,
    [LIVE_CHAT_STATUS.WAITING]
  );
  const changes = rebalanceQueue(
    rows.map((row) => ({ id: row.id as string, queuedForId: (row.queued_for_id as number | null) ?? null })),
    members
  );
  if (changes.size > 0) {
    await client.query(
      `UPDATE live_chat_conversations c
       SET queued_for_id = p.member_id,
           updated_at = NOW()
       FROM unnest($1::uuid[], $2::int[]) AS p(id, member_id)
       WHERE c.id = p.id
         AND c.status = $3`,
      [[...changes.keys()], [...changes.values()], LIVE_CHAT_STATUS.WAITING]
    );
  }
  return changes;
}

export function assignedFrom(changes: Map<string, number | null>): [string, number][] {
  return [...changes].filter((entry): entry is [string, number] => entry[1] !== null);
}
