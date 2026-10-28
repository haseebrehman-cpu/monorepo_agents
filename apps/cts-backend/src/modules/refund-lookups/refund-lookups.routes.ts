import { Router } from "express";
import { P } from "../../config/features.js";
import { authenticate, requireSuperAdminOrPermission } from "../../core/auth.middleware.js";
import { refundLookupsController } from "./refund-lookups.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdminOrPermission(P.LOOKUPS_MANAGE));
router.get("/", refundLookupsController.list);
router.post("/", refundLookupsController.create);
router.patch("/:id", refundLookupsController.update);
router.delete("/:id", refundLookupsController.remove);

export default router;
