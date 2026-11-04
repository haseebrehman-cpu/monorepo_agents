import { CUSTOMER_EVENTS_CHANNEL } from "./live-chat.constants.js";
import { parseCustomerNotice, type CustomerNotice } from "./live-chat.events.js";
import { customerChatService, type CustomerMessage, type CustomerStatus } from "./customer.service.js";
import { createChannelListener } from "./pg-listener.js";

export type CustomerStreamEvent =
  | { type: "message"; message: CustomerMessage }
  | { type: "status"; status: CustomerStatus }
  | { type: "typing"; typing: boolean };

type Subscriber = {
  conversationId: string;
  send: (event: CustomerStreamEvent) => void;
  close: () => void;
};

function createCustomerEventHub() {
  const byConversation = new Map<string, Set<Subscriber>>();
  /** Notices for one conversation are delivered in the order they were sent. */
  const deliveries = new Map<string, Promise<void>>();

  function closeConversation(conversationId: string) {
    for (const subscriber of [...(byConversation.get(conversationId) ?? [])]) subscriber.close();
  }

  function closeAll() {
    for (const conversationId of [...byConversation.keys()]) closeConversation(conversationId);
  }

  async function deliver(notice: CustomerNotice) {
    if (!byConversation.has(notice.conversationId)) return;
    if (notice.typing !== undefined && notice.messageIds.length === 0 && !notice.status) {
      for (const subscriber of byConversation.get(notice.conversationId) ?? []) {
        subscriber.send({ type: "typing", typing: notice.typing });
      }
      return;
    }
    const [messages, status] = await Promise.all([
      customerChatService.messagesByIds(notice.conversationId, notice.messageIds),
      notice.status ? customerChatService.status(notice.conversationId) : null,
    ]);
    for (const subscriber of byConversation.get(notice.conversationId) ?? []) {
      try {
        for (const message of messages) subscriber.send({ type: "message", message });
        if (status) subscriber.send({ type: "status", status });
      } catch (error) {
        console.error("[liveChat.customerEvents] failed to send event:", error);
      }
    }
  }

  function enqueue(notice: CustomerNotice) {
    const { conversationId } = notice;
    // Most notices are for chats whose customer is connected to another process.
    if (!byConversation.has(conversationId)) return;
    const next = (deliveries.get(conversationId) ?? Promise.resolve())
      .then(() => deliver(notice))
      .catch((error) => {
        console.error("[liveChat.customerEvents] delivery failed:", error);
        // Reconnecting replays from the client's cursor, so nothing is lost.
        closeConversation(conversationId);
      });
    deliveries.set(conversationId, next);
    void next.then(() => {
      if (deliveries.get(conversationId) === next) deliveries.delete(conversationId);
    });
  }

  const listener = createChannelListener({
    channel: CUSTOMER_EVENTS_CHANNEL,
    label: "liveChat.customerEvents",
    isWanted: () => byConversation.size > 0,
    onPayload: (payload) => {
      const notice = parseCustomerNotice(payload);
      if (notice) enqueue(notice);
    },
    onMissed: closeAll,
  });

  return {
    /** `ready` settles once the listener is up, so a replay that follows it misses nothing. */
    subscribe(subscriber: Subscriber) {
      let subscribers = byConversation.get(subscriber.conversationId);
      if (!subscribers) {
        subscribers = new Set();
        byConversation.set(subscriber.conversationId, subscribers);
      }
      subscribers.add(subscriber);
      return {
        ready: listener.ensure(),
        unsubscribe: () => {
          const current = byConversation.get(subscriber.conversationId);
          current?.delete(subscriber);
          if (current?.size === 0) byConversation.delete(subscriber.conversationId);
          listener.stopIfIdle();
        },
      };
    },
    countFor(conversationId: string) {
      return byConversation.get(conversationId)?.size ?? 0;
    },
    /** Ends every open stream, e.g. on shutdown. Clients reconnect and replay. */
    closeAll,
  };
}

export const customerEventHub = createCustomerEventHub();
