import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../../core/auth.middleware.js";
import { departmentsController } from "./departments.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get("/", departmentsController.list);

export default router;
