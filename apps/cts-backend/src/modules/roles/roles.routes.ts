import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../../core/auth.middleware.js";
import { rolesController } from "./roles.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get("/", rolesController.list);
router.get("/permissions", rolesController.listPermissions);
router.get("/features", rolesController.listFeatures);

export default router;
