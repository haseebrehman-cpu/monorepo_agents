import type { Request, Response } from "express";
import type { z } from "zod";
import { P, ROLE } from "../../config/features.js";
import type { AuthUser } from "../../core/auth.middleware.js";
import {
  conversationParamsSchema,
  memberParamsSchema,
  sendMessageSchema,
  transferSchema,
  typingSchema,
  updateMemberSchema,
  updatePresenceSchema,
} from "./desk.schema.js";
import { DeskError, deskService, type Viewer } from "./desk.service.js";
import {
  EVENTS_HEARTBEAT_MS,
  EVENTS_MAX_STREAM_MS,
  EVENTS_MAX_STREAMS_PER_USER,
} from "./live-chat.constants.js";
import { deskEventHub } from "./live-chat.events.js";

function viewerFrom(user: AuthUser): Viewer {
  const isAdmin = user.roles.includes(ROLE.ADMIN);
  return {
    userId: user.userId,
    isAdmin,
    canAssign: isAdmin || user.permissions.includes(P.LIVE_CHAT_ASSIGN),
    departmentId: user.departmentId,
  };
}

class BadRequest extends Error {
  constructor(readonly details: { path: string; message: string }[]) {
    super("INVALID_REQUEST");
  }
}

function parse<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BadRequest(
      parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    );
  }
  return parsed.data;
}

function handle(
  label: string,
  action: (req: Request, viewer: Viewer) => Promise<unknown>,
  status = 200
) {
  return async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    try {
      const data = await action(req, viewerFrom(req.user));
      return res.status(status).json(data === undefined ? { success: true } : { success: true, data });
    } catch (error) {
      if (error instanceof BadRequest) {
        return res.status(400).json({ success: false, error: error.message, details: error.details });
      }
      if (error instanceof DeskError) {
        return res.status(error.status).json({ success: false, error: error.code });
      }
      console.error(`[liveChat.${label}] failed:`, error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  };
}

const conversationId = (req: Request) => parse(conversationParamsSchema, req.params).conversationId;

export const deskController = {
  me: handle("me", (_req, viewer) => deskService.getMe(viewer)),

  updateMe: handle("updateMe", (req, viewer) =>
    deskService.updateMe(viewer, parse(updatePresenceSchema, req.body))
  ),

  members: handle("members", (_req, viewer) => deskService.listMembers(viewer)),

  updateMember: handle("updateMember", (req, viewer) => {
    const { memberId } = parse(memberParamsSchema, req.params);
    const { limit } = parse(updateMemberSchema, req.body);
    return deskService.updateMemberLimit(viewer, memberId, limit);
  }),

  conversations: handle("conversations", (_req, viewer) => deskService.listConversations(viewer)),

  conversation: handle("conversation", async (req, viewer) => {
    const conversation = await deskService.getConversation(viewer, conversationId(req));
    if (!conversation) throw new DeskError(404, "CONVERSATION_NOT_FOUND");
    return conversation;
  }),

  read: handle("read", async (req, viewer) => {
    await deskService.markRead(viewer, conversationId(req));
  }),

  take: handle("take", (req, viewer) => deskService.take(viewer, conversationId(req))),

  transfer: handle("transfer", (req, viewer) => {
    const id = conversationId(req);
    const { memberId } = parse(transferSchema, req.body);
    return deskService.transfer(viewer, id, memberId);
  }),

  resolve: handle("resolve", (req, viewer) => deskService.resolve(viewer, conversationId(req))),

  sendMessage: handle(
    "sendMessage",
    (req, viewer) => {
      const id = conversationId(req);
      return deskService.sendMessage(viewer, id, parse(sendMessageSchema, req.body));
    },
    201
  ),

  typing: handle("typing", async (req, viewer) => {
    const { typing } = parse(typingSchema, req.body);
    await deskService.setTyping(viewer, conversationId(req), typing);
  }),

  /** Server-Sent Events. Message bodies are pushed as `message` events. */
  events(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    const userId = req.user.userId;
    if (deskEventHub.countFor(userId) >= EVENTS_MAX_STREAMS_PER_USER) {
      return res.status(429).json({ success: false, error: "TOO_MANY_STREAMS" });
    }

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(expiry);
      unsubscribe();
      res.end();
    };
    const unsubscribe = deskEventHub.subscribe({
      userId,
      isAdmin: req.user.roles.includes(ROLE.ADMIN),
      departmentId: req.user.departmentId,
      send: (frame) => {
        if (!closed) res.write(frame);
      },
      close,
    });
    const heartbeat = setInterval(() => res.write(": ping\n\n"), EVENTS_HEARTBEAT_MS);
    const expiry = setTimeout(close, EVENTS_MAX_STREAM_MS);
    req.on("close", close);
  },
};
