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
import { authenticateCustomer, customerController } from "./customer.controller.js";
import { deskController } from "./desk.controller.js";
import { handoffsController } from "./handoffs.controller.js";
import { CUSTOMER_RATE_LIMIT, DESK_RATE_LIMIT, HANDOFF_RATE_LIMIT } from "./live-chat.constants.js";

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

const customerIpRateLimit = rateLimit({
  windowMs: CUSTOMER_RATE_LIMIT.windowMs,
  maxRequests: CUSTOMER_RATE_LIMIT.maxRequests,
  key: (req) => `customer|${req.ip ?? ""}`,
});

const customerStreamRateLimit = rateLimit({
  windowMs: CUSTOMER_RATE_LIMIT.windowMs,
  maxRequests: CUSTOMER_RATE_LIMIT.maxStreams,
  key: (req) => `customer-stream|${req.liveChatConversationId ?? ""}`,
});

const customerMessageRateLimit = rateLimit({
  windowMs: CUSTOMER_RATE_LIMIT.windowMs,
  maxRequests: CUSTOMER_RATE_LIMIT.maxMessages,
  key: (req) => `customer-message|${req.liveChatConversationId ?? ""}`,
});

const customerSessionRateLimit = rateLimit({
  windowMs: CUSTOMER_RATE_LIMIT.windowMs,
  maxRequests: CUSTOMER_RATE_LIMIT.maxSessions,
  key: (req) => `customer-session|${req.ip ?? ""}`,
  error: "TOO_MANY_REQUESTS",
});

const customerTypingRateLimit = rateLimit({
  windowMs: CUSTOMER_RATE_LIMIT.windowMs,
  maxRequests: CUSTOMER_RATE_LIMIT.maxTyping,
  key: (req) => `customer-typing|${req.liveChatConversationId ?? ""}`,
});

const deskTypingRateLimit = rateLimit({
  windowMs: DESK_RATE_LIMIT.windowMs,
  maxRequests: DESK_RATE_LIMIT.maxTyping,
  key: (req) => `desk-typing|${req.user?.userId ?? req.ip ?? ""}`,
});

const canAssign = requirePermission(P.LIVE_CHAT_ASSIGN);
const canReply = requirePermission(P.LIVE_CHAT_REPLY);
const canResolve = requirePermission(P.LIVE_CHAT_RESOLVE);

const router = Router();

router.post("/handoffs", handoffRateLimit, authenticateServiceToken, handoffsController.create);

// Mounted before the bearer-token router. The assistant reply has the handoff id, not a token yet.
router.post("/customer/session", customerSessionRateLimit, customerController.openSession);

const customer = Router();
customer.use(customerIpRateLimit, authenticateCustomer);
customer.get("/events", customerStreamRateLimit, customerController.events);
customer.post("/typing", customerTypingRateLimit, customerController.setTyping);
customer.post("/messages", customerMessageRateLimit, customerController.sendMessage);

// Mounted before the desk router, which requires a staff session for every path it sees.
router.use("/customer", customer);

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
desk.post("/conversations/:conversationId/typing", canReply, deskTypingRateLimit, deskController.typing);

router.use(desk);

export default router;
