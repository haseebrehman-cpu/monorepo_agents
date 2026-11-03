import type { Client, PoolClient } from "pg";
import { createDbClient } from "../../core/db.js";
import { EVENTS_CHANNEL, MAX_EVENT_IDS } from "./live-chat.constants.js";

/** Carries ids only. Desks refetch through the permission-checked API. */
export type DeskEvent = {
  /** Conversations that changed in any way. `null` means refetch everything. */
  ids: string[] | null;
  /** [conversationId, memberId] for chats newly placed into a member's Active tab. */
  assigned: [string, number][];
  /** New handoffs that nobody had room for. */
  queued: string[];
  /** A member's limit or online status changed. */
  members?: boolean;
};

export type DeskEventForUser = {
  ids: string[] | null;
  assignedToYou: string[];
  queued: string[];
  members: boolean;
};

type Subscriber = {
  userId: number;
  send: (event: DeskEventForUser) => void;
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

export function eventForUser(event: DeskEvent, userId: number): DeskEventForUser {
  return {
    ids: event.ids,
    assignedToYou: event.assigned
      .filter(([, memberId]) => memberId === userId)
      .map(([conversationId]) => conversationId),
    queued: event.queued,
    members: event.members === true,
  };
}

function parseEvent(payload: string | undefined): DeskEvent | null {
  if (!payload) return null;
  try {
    const value = JSON.parse(payload) as DeskEvent;
    if (!Array.isArray(value.assigned) || !Array.isArray(value.queued)) return null;
    if (value.ids !== null && !Array.isArray(value.ids)) return null;
    return value;
  } catch {
    return null;
  }
}

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

function createDeskEventHub() {
  const subscribers = new Set<Subscriber>();
  let listener: Client | null = null;
  let connecting: Promise<void> | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let attempts = 0;

  function broadcast(event: DeskEvent) {
    for (const subscriber of subscribers) {
      try {
        subscriber.send(eventForUser(event, subscriber.userId));
      } catch (error) {
        console.error("[liveChat.events] failed to send event:", error);
      }
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer || subscribers.size === 0) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)];
    attempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void ensureListening();
    }, delay);
    reconnectTimer.unref();
  }

  function dropListener(client: Client) {
    if (listener !== client) return;
    listener = null;
    client.removeAllListeners();
    void client.end().catch(() => undefined);
    // Changes made while disconnected were missed, so every desk refetches.
    broadcast(REFETCH_ALL);
    scheduleReconnect();
  }

  async function ensureListening() {
    if (listener || connecting || subscribers.size === 0) return connecting ?? undefined;
    connecting = (async () => {
      const client = createDbClient();
      client.on("notification", (message) => {
        if (message.channel !== EVENTS_CHANNEL) return;
        const event = parseEvent(message.payload);
        if (event) broadcast(event);
      });
      client.on("error", (error) => {
        console.error("[liveChat.events] listener error:", error);
        dropListener(client);
      });
      client.on("end", () => dropListener(client));
      try {
        await client.connect();
        await client.query(`LISTEN ${EVENTS_CHANNEL}`);
        listener = client;
        attempts = 0;
        stopIfIdle();
      } catch (error) {
        console.error("[liveChat.events] could not listen:", error);
        client.removeAllListeners();
        void client.end().catch(() => undefined);
        scheduleReconnect();
      }
    })().finally(() => {
      connecting = null;
    });
    return connecting;
  }

  function stopIfIdle() {
    if (subscribers.size > 0) return;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    const client = listener;
    listener = null;
    if (client) {
      client.removeAllListeners();
      void client.end().catch(() => undefined);
    }
  }

  return {
    subscribe(subscriber: Subscriber) {
      subscribers.add(subscriber);
      void ensureListening();
      return () => {
        subscribers.delete(subscriber);
        stopIfIdle();
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
