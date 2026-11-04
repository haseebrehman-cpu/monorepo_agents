import type { NextFunction, Request, Response } from "express";
import { readBearerToken } from "../../core/bearer-token.js";
import { customerEventHub, type CustomerStreamEvent } from "./customer-events.js";
import { customerMessageSchema, customerSessionSchema, parseCursor, typingSchema } from "./customer.schema.js";
import { CustomerChatError, customerChatService } from "./customer.service.js";
import { verifyCustomerToken } from "./customer-token.js";
import { notifyDeskTyping } from "./live-chat.events.js";
import {
  CUSTOMER_MAX_STREAMS_PER_CONVERSATION,
  CUSTOMER_STREAM_MAX_MS,
  EVENTS_HEARTBEAT_MS,
} from "./live-chat.constants.js";

declare global {
  namespace Express {
    interface Request {
      /** The desk conversation a customer token grants. */
      liveChatConversationId?: string;
    }
  }
}

/** Accepts only a customer token from the handoff. Staff sessions and service tokens are rejected. */
export function authenticateCustomer(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ success: false, error: "NO_TOKEN" });
  const conversationId = verifyCustomerToken(token);
  if (!conversationId) return res.status(401).json({ success: false, error: "INVALID_TOKEN" });
  req.liveChatConversationId = conversationId;
  next();
}

function formatEvent(event: CustomerStreamEvent) {
  if (event.type === "message") {
    return `id: ${event.message.id}\nevent: message\ndata: ${JSON.stringify(event.message)}\n\n`;
  }
  if (event.type === "typing") {
    return `event: typing\ndata: ${JSON.stringify({ typing: event.typing })}\n\n`;
  }
  return `event: status\ndata: ${JSON.stringify(event.status)}\n\n`;
}

export const customerController = {
  /** Turns the handoff id the assistant already returned into a customer token. */
  async openSession(req: Request, res: Response) {
    const parsed = customerSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "INVALID_REQUEST" });
    }
    try {
      const customerToken = await customerChatService.issueToken(parsed.data.handoffId);
      if (!customerToken) {
        return res.status(404).json({ success: false, error: "CONVERSATION_NOT_FOUND" });
      }
      return res.status(200).json({ success: true, data: { customerToken } });
    } catch (error) {
      console.error("[liveChat.customer.openSession] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async setTyping(req: Request, res: Response) {
    const parsed = typingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: "INVALID_REQUEST" });
    try {
      const conversationId = req.liveChatConversationId!;
      const exists = (await customerChatService.status(conversationId)) !== null;
      if (!exists) return res.status(404).json({ success: false, error: "CONVERSATION_NOT_FOUND" });
      await notifyDeskTyping(conversationId, parsed.data.typing);
      return res.status(204).end();
    } catch (error) {
      console.error("[liveChat.customer.setTyping] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async sendMessage(req: Request, res: Response) {
    const conversationId = req.liveChatConversationId!;
    const parsed = customerMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REQUEST",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    try {
      const message = await customerChatService.send(conversationId, parsed.data);
      return res.status(201).json({ success: true, data: message });
    } catch (error) {
      if (error instanceof CustomerChatError) {
        return res.status(error.status).json({ success: false, error: error.code });
      }
      console.error("[liveChat.customer.sendMessage] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  /**
   * Server-Sent Events. Opens with the messages after `Last-Event-ID` (or the
   * latest page) and the current status, then pushes changes as they commit.
   */
  async events(req: Request, res: Response) {
    const conversationId = req.liveChatConversationId!;
    if (customerEventHub.countFor(conversationId) >= CUSTOMER_MAX_STREAMS_PER_CONVERSATION) {
      return res.status(429).json({ success: false, error: "TOO_MANY_STREAMS" });
    }

    let exists: boolean;
    try {
      exists = (await customerChatService.status(conversationId)) !== null;
    } catch (error) {
      console.error("[liveChat.customer.events] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
    if (!exists) return res.status(404).json({ success: false, error: "CONVERSATION_NOT_FOUND" });

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 3000\n\n");

    let closed = false;
    // Live events wait here until the replay is written, so ids go out in order.
    let buffered: CustomerStreamEvent[] | null = [];
    const write = (event: CustomerStreamEvent) => {
      if (!closed) res.write(formatEvent(event));
    };
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(expiry);
      unsubscribe();
      res.end();
    };
    const { ready, unsubscribe } = customerEventHub.subscribe({
      conversationId,
      send: (event) => {
        if (buffered) buffered.push(event);
        else write(event);
      },
      close,
    });
    const heartbeat = setInterval(() => {
      if (!closed) res.write(": ping\n\n");
    }, EVENTS_HEARTBEAT_MS);
    const expiry = setTimeout(close, CUSTOMER_STREAM_MAX_MS);
    req.on("close", close);

    try {
      if (!(await ready)) throw new Error("LISTENER_UNAVAILABLE");
      const [messages, status] = await Promise.all([
        customerChatService.messages(conversationId, parseCursor(req.get("last-event-id"))),
        customerChatService.status(conversationId),
      ]);
      let lastId = BigInt(0);
      for (const message of messages) {
        write({ type: "message", message });
        lastId = BigInt(message.id);
      }
      if (status) write({ type: "status", status });
      const pending = buffered;
      buffered = null;
      for (const event of pending) {
        if (event.type === "message" && BigInt(event.message.id) <= lastId) continue;
        write(event);
      }
    } catch (error) {
      console.error("[liveChat.customer.events] replay failed:", error);
      close();
    }
  },
};
