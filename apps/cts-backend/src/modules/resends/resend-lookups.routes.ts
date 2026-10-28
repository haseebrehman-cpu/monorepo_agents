import { Router } from "express";
import { P } from "../../config/features.js";
import { authenticate, requireSuperAdminOrPermission } from "../../core/auth.middleware.js";
import { resendLookupsController } from "./resend-lookups.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdminOrPermission(P.LOOKUPS_MANAGE));
router.get("/", resendLookupsController.list);
router.post("/", resendLookupsController.create);
router.patch("/:id", resendLookupsController.update);
router.delete("/:id", resendLookupsController.remove);

export default router;
