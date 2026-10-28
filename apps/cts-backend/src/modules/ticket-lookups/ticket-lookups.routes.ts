import { Router } from "express";
import { P } from "../../config/features.js";
import { authenticate, requireSuperAdminOrPermission } from "../../core/auth.middleware.js";
import { ticketLookupsController } from "./ticket-lookups.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdminOrPermission(P.LOOKUPS_MANAGE));
router.get("/", ticketLookupsController.list);
router.post("/", ticketLookupsController.create);
router.patch("/:id", ticketLookupsController.update);
router.delete("/:id", ticketLookupsController.remove);

export default router;
