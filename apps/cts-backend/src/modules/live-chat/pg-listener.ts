import type { Client } from "pg";

const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];

/**
 * One dedicated connection that LISTENs on `channel` while `isWanted()` is true.
 * Reconnects with backoff. `onMissed` runs when an open connection drops,
 * because notifications sent while disconnected are lost.
 */
export function createChannelListener(options: {
  channel: string;
  label: string;
  isWanted: () => boolean;
  onPayload: (payload: string | undefined) => void;
  onMissed: () => void;
}) {
  const { channel, label, isWanted, onPayload, onMissed } = options;
  let listener: Client | null = null;
  let connecting: Promise<void> | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let attempts = 0;

  function scheduleReconnect() {
    if (reconnectTimer || !isWanted()) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(attempts, RECONNECT_DELAYS_MS.length - 1)];
    attempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void ensure();
    }, delay);
    reconnectTimer.unref();
  }

  function dropListener(client: Client) {
    if (listener !== client) return;
    listener = null;
    client.removeAllListeners();
    void client.end().catch(() => undefined);
    onMissed();
    scheduleReconnect();
  }

  /** True once listening. False after a failed attempt, which is retried in the background. */
  async function ensure(): Promise<boolean> {
    if (listener) return true;
    if (!isWanted()) return false;
    if (!connecting) connecting = connect();
    await connecting;
    return listener !== null;
  }

  function connect() {
    return (async () => {
      // Loaded on first use so importing this module does not require a database.
      const { createDbClient } = await import("../../core/db.js");
      const client = createDbClient();
      client.on("notification", (message) => {
        if (message.channel === channel) onPayload(message.payload);
      });
      client.on("error", (error) => {
        console.error(`[${label}] listener error:`, error);
        dropListener(client);
      });
      client.on("end", () => dropListener(client));
      try {
        await client.connect();
        await client.query(`LISTEN ${channel}`);
        listener = client;
        attempts = 0;
        stopIfIdle();
      } catch (error) {
        console.error(`[${label}] could not listen:`, error);
        client.removeAllListeners();
        void client.end().catch(() => undefined);
        scheduleReconnect();
      }
    })().finally(() => {
      connecting = null;
    });
  }

  function stopIfIdle() {
    if (isWanted()) return;
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

  return { ensure, stopIfIdle };
}
