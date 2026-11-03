import { Router } from "express";
import { P } from "../../config/features.js";
import {
  authenticate,
  authenticateServiceToken,
  rejectServiceAccount,
  rejectSuperAdmin,
  requireAdmin,
  requirePermission,
} from "../../core/auth.middleware.js";
import { rateLimit } from "../../core/rate-limit.js";
import { deskController } from "./desk.controller.js";
import { handoffsController } from "./handoffs.controller.js";
import { DESK_RATE_LIMIT, HANDOFF_RATE_LIMIT } from "./live-chat.constants.js";

const handoffRateLimit = rateLimit({
  windowMs: HANDOFF_RATE_LIMIT.windowMs,
  maxRequests: HANDOFF_RATE_LIMIT.maxRequests,
  key: (req) => `handoff|${req.ip ?? ""}`,
  error: "TOO_MANY_HANDOFFS",
});

const deskRateLimit = rateLimit({
  windowMs: DESK_RATE_LIMIT.windowMs,
  maxRequests: DESK_RATE_LIMIT.maxRequests,
  key: (req) => `desk|${req.user?.userId ?? req.ip ?? ""}`,
});

const actionRateLimit = rateLimit({
  windowMs: DESK_RATE_LIMIT.windowMs,
  maxRequests: DESK_RATE_LIMIT.maxMutations,
  key: (req) => `desk-action|${req.user?.userId ?? req.ip ?? ""}`,
});

const canAssign = requirePermission(P.LIVE_CHAT_ASSIGN);
const canReply = requirePermission(P.LIVE_CHAT_REPLY);
const canResolve = requirePermission(P.LIVE_CHAT_RESOLVE);

const router = Router();

router.post("/handoffs", handoffRateLimit, authenticateServiceToken, handoffsController.create);

const desk = Router();
desk.use(
  authenticate,
  rejectServiceAccount,
  rejectSuperAdmin,
  requirePermission(P.LIVE_CHAT_ACCESS),
  deskRateLimit
);

desk.get("/events", deskController.events);
desk.get("/me", deskController.me);
desk.patch("/me", canAssign, actionRateLimit, deskController.updateMe);
desk.get("/members", deskController.members);
desk.patch("/members/:memberId", requireAdmin, actionRateLimit, deskController.updateMember);

desk.get("/conversations", deskController.conversations);
desk.get("/conversations/:conversationId", deskController.conversation);
desk.post("/conversations/:conversationId/read", deskController.read);
desk.post("/conversations/:conversationId/take", canAssign, actionRateLimit, deskController.take);
desk.post("/conversations/:conversationId/transfer", canAssign, actionRateLimit, deskController.transfer);
desk.post("/conversations/:conversationId/resolve", canResolve, actionRateLimit, deskController.resolve);
desk.post("/conversations/:conversationId/reopen", canAssign, actionRateLimit, deskController.reopen);
desk.post("/conversations/:conversationId/messages", canReply, actionRateLimit, deskController.sendMessage);

router.use(desk);

export default router;
