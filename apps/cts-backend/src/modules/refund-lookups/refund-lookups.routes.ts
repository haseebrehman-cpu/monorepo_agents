import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../../core/auth.middleware.js";
import { refundLookupsController } from "./refund-lookups.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get("/", refundLookupsController.list);
router.post("/", refundLookupsController.create);
router.patch("/:id", refundLookupsController.update);
router.delete("/:id", refundLookupsController.remove);

export default router;
