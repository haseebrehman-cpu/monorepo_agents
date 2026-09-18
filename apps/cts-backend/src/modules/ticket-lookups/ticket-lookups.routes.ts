import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../../core/auth.middleware.js";
import { ticketLookupsController } from "./ticket-lookups.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get("/", ticketLookupsController.list);
router.post("/", ticketLookupsController.create);
router.patch("/:id", ticketLookupsController.update);
router.delete("/:id", ticketLookupsController.remove);

export default router;
