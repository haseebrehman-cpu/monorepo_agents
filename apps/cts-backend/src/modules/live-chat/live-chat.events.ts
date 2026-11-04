import type { PoolClient } from "pg";
import { CUSTOMER_EVENTS_CHANNEL, EVENTS_CHANNEL, MAX_EVENT_IDS } from "./live-chat.constants.js";
import { createChannelListener } from "./pg-listener.js";

/**
 * Ids for inbox changes. `liveMessages` are pushed on the open stream instead of
 * making every desk reload the thread. `typing` is ephemeral.
 */
export type DeskEvent = {
  /** Conversations that changed in any way. `null` means refetch everything. */
  ids: string[] | null;
  /** [conversationId, memberId] for chats newly placed into a member's Active tab. */
  assigned: [string, number][];
  /** New handoffs that nobody had room for. */
  queued: string[];
  /** A member's limit or online status changed. */
  members?: boolean;
  /** Append these messages. The desk does not refetch the thread. */
  liveMessages?: { conversationId: string; messageIds: string[] }[];
  typing?: { conversationId: string; typing: boolean };
};

export type DeskEventForUser = {
  ids: string[] | null;
  assignedToYou: string[];
  queued: string[];
  members: boolean;
  /** True when new messages arrive on the `message` event and the thread should not reload. */
  live: boolean;
};

export type DeskStreamMessage = {
  id: string;
  author: "customer" | "assistant" | "agent" | "system" | "note";
  authorName: string;
  body: string;
  at: string;
};

type Subscriber = {
  userId: number;
  isAdmin: boolean;
  departmentId: number | null;
  send: (frame: string) => void;
  close: () => void;
};

const REFETCH_ALL: DeskEvent = { ids: null, assigned: [], queued: [], members: true };

/** Must run inside the transaction that made the change, so it is delivered only on commit. */
export async function publishDeskEvent(client: PoolClient, event: DeskEvent) {
  const tooMany =
    (event.ids?.length ?? 0) > MAX_EVENT_IDS ||
    event.assigned.length > MAX_EVENT_IDS ||
    event.queued.length > MAX_EVENT_IDS;
  const payload: DeskEvent = tooMany ? REFETCH_ALL : event;
  await client.query("SELECT pg_notify($1, $2)", [EVENTS_CHANNEL, JSON.stringify(payload)]);
}

/** Ids only, so the payload stays small. Each process loads the rows once for its own streams. */
export type CustomerNotice = {
  conversationId: string;
  messageIds: string[];
  /** The conversation's status or agent changed. */
  status: boolean;
  /** Append on the desk stream instead of asking every desk to reload. */
  live?: boolean;
  /** Private notes stay on the desk. */
  customerVisible?: boolean;
  typing?: boolean;
};

/** Must run inside the transaction that made the change, so it is delivered only on commit. */
export async function publishCustomerEvent(client: PoolClient, notice: CustomerNotice) {
  if (notice.customerVisible === false) return;
  if (notice.messageIds.length === 0 && !notice.status && notice.typing === undefined) return;
  await client.query("SELECT pg_notify($1, $2)", [
    CUSTOMER_EVENTS_CHANNEL,
    JSON.stringify({ c: notice.conversationId, m: notice.messageIds, s: notice.status }),
  ]);
}

export function parseCustomerNotice(payload: string | undefined): CustomerNotice | null {
  if (!payload) return null;
  try {
    const value = JSON.parse(payload) as { c?: unknown; m?: unknown; s?: unknown; t?: unknown };
    if (typeof value.c !== "string" || !Array.isArray(value.m)) return null;
    if (!value.m.every((id) => typeof id === "string" && /^\d+$/.test(id))) return null;
    return {
      conversationId: value.c,
      messageIds: value.m as string[],
      status: value.s === true,
      typing: value.t === true ? true : value.t === false ? false : undefined,
    };
  } catch {
    return null;
  }
}

export function eventForUser(event: DeskEvent, userId: number): DeskEventForUser {
  return {
    ids: event.ids,
    assignedToYou: event.assigned
      .filter(([, memberId]) => memberId === userId)
      .map(([conversationId]) => conversationId),
    queued: event.queued,
    members: event.members === true,
    live: event.liveMessages !== undefined && event.liveMessages.length > 0,
  };
}

/** A typing flag. Delivered immediately, outside a message transaction. */
export async function notifyDeskTyping(conversationId: string, typing: boolean) {
  const event: DeskEvent = {
    ids: [],
    assigned: [],
    queued: [],
    typing: { conversationId, typing },
  };
  const { pool } = await import("../../core/db.js");
  await pool.query("SELECT pg_notify($1, $2)", [EVENTS_CHANNEL, JSON.stringify(event)]);
}

/** Tells the customer's open stream that the agent is typing. */
export async function notifyCustomerTyping(conversationId: string, typing: boolean) {
  const { pool } = await import("../../core/db.js");
  await pool.query("SELECT pg_notify($1, $2)", [
    CUSTOMER_EVENTS_CHANNEL,
    JSON.stringify({ c: conversationId, m: [], s: false, t: typing }),
  ]);
}

type ConversationAccess = {
  status: string;
  queuedForId: number | null;
  ownerId: number | null;
  departmentId: number | null;
};

function parseIdList(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && /^\d+$/.test(id))) {
    return null;
  }
  return value;
}

function parseEvent(payload: string | undefined): DeskEvent | null {
  if (!payload) return null;
  try {
    const value = JSON.parse(payload) as DeskEvent;
    if (!Array.isArray(value.assigned) || !Array.isArray(value.queued)) return null;
    if (value.ids !== null && !Array.isArray(value.ids)) return null;
    if (value.liveMessages !== undefined) {
      if (!Array.isArray(value.liveMessages)) return null;
      for (const group of value.liveMessages) {
        if (typeof group?.conversationId !== "string" || !parseIdList(group.messageIds)) return null;
      }
    }
    if (value.typing !== undefined) {
      if (typeof value.typing.conversationId !== "string" || typeof value.typing.typing !== "boolean") {
        return null;
      }
    }
    return value;
  } catch {
    return null;
  }
}

function canSee(access: ConversationAccess, subscriber: Subscriber) {
  if (access.status === "waiting" && (access.queuedForId === null || access.queuedForId === subscriber.userId)) {
    return true;
  }
  if (access.status !== "waiting" && access.ownerId === subscriber.userId) return true;
  return subscriber.isAdmin && access.departmentId === subscriber.departmentId;
}

async function loadAccess(conversationId: string): Promise<ConversationAccess | null> {
  const { pool } = await import("../../core/db.js");
  const { rows } = await pool.query(
    `SELECT c.status, c.queued_for_id, c.owner_id, u.department_id
     FROM live_chat_conversations c
     LEFT JOIN users u ON u.id = COALESCE(c.owner_id, c.queued_for_id)
     WHERE c.id = $1`,
    [conversationId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    status: row.status as string,
    queuedForId: (row.queued_for_id as number | null) ?? null,
    ownerId: (row.owner_id as number | null) ?? null,
    departmentId: (row.department_id as number | null) ?? null,
  };
}

async function loadMessages(conversationId: string, messageIds: string[]): Promise<DeskStreamMessage[]> {
  if (messageIds.length === 0) return [];
  const { pool } = await import("../../core/db.js");
  const { rows } = await pool.query(
    `SELECT id, author, author_name, body, sent_at
     FROM live_chat_messages
     WHERE conversation_id = $1 AND id = ANY($2::bigint[])
     ORDER BY id`,
    [conversationId, messageIds]
  );
  return rows.map((row) => ({
    id: String(row.id),
    author: row.author as DeskStreamMessage["author"],
    authorName: row.author_name as string,
    body: row.body as string,
    at: (row.sent_at as Date).toISOString(),
  }));
}

function deskFrame(event: DeskEventForUser) {
  return `event: desk\ndata: ${JSON.stringify(event)}\n\n`;
}

function createDeskEventHub() {
  const subscribers = new Set<Subscriber>();
  let delivery: Promise<void> = Promise.resolve();

  function write(subscriber: Subscriber, frame: string) {
    try {
      subscriber.send(frame);
    } catch (error) {
      console.error("[liveChat.events] failed to send event:", error);
    }
  }

  async function deliver(event: DeskEvent) {
    const typingAccess = event.typing ? await loadAccess(event.typing.conversationId) : null;
    const live = [];
    for (const group of event.liveMessages ?? []) {
      const [access, messages] = await Promise.all([
        loadAccess(group.conversationId),
        loadMessages(group.conversationId, group.messageIds),
      ]);
      if (access && messages.length > 0) live.push({ access, messages, conversationId: group.conversationId });
    }

    const deskEvent = event.typing && !event.liveMessages && event.ids?.length === 0 ? null : event;
    for (const subscriber of subscribers) {
      if (event.typing && typingAccess && canSee(typingAccess, subscriber)) {
        write(
          subscriber,
          `event: typing\ndata: ${JSON.stringify({
            conversationId: event.typing.conversationId,
            typing: event.typing.typing,
          })}\n\n`
        );
      }
      for (const group of live) {
        if (!canSee(group.access, subscriber)) continue;
        for (const message of group.messages) {
          write(
            subscriber,
            `event: message\ndata: ${JSON.stringify({ conversationId: group.conversationId, message })}\n\n`
          );
        }
      }
      if (deskEvent) write(subscriber, deskFrame(eventForUser(deskEvent, subscriber.userId)));
    }
  }

  function enqueue(event: DeskEvent) {
    delivery = delivery.then(() => deliver(event)).catch((error) => {
      console.error("[liveChat.events] delivery failed:", error);
    });
  }

  const listener = createChannelListener({
    channel: EVENTS_CHANNEL,
    label: "liveChat.events",
    isWanted: () => subscribers.size > 0,
    onPayload: (payload) => {
      const event = parseEvent(payload);
      if (event) enqueue(event);
    },
    // Changes made while disconnected were missed, so every desk refetches.
    onMissed: () => enqueue(REFETCH_ALL),
  });

  return {
    subscribe(subscriber: Subscriber) {
      subscribers.add(subscriber);
      void listener.ensure();
      return () => {
        subscribers.delete(subscriber);
        listener.stopIfIdle();
      };
    },
    countFor(userId: number) {
      let count = 0;
      for (const subscriber of subscribers) if (subscriber.userId === userId) count += 1;
      return count;
    },
    /** Ends every open stream, e.g. on shutdown. Browsers reconnect on their own. */
    closeAll() {
      for (const subscriber of [...subscribers]) subscriber.close();
    },
  };
}

export const deskEventHub = createDeskEventHub();
