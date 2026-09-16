import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authenticate } from "../../core/auth.middleware.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

export default router