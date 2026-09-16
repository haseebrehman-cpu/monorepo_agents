import { Router } from "express";
import { meController } from "./me.controller.js";
import { authenticate } from "../../core/auth.middleware.js";

const router = Router();

router.get("/config", authenticate, meController.config);

export default router;