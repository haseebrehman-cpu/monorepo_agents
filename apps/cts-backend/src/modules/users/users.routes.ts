import { Router } from "express";
import { authenticate, requireSuperAdmin } from "../../core/auth.middleware.js";
import { usersController } from "./users.controller.js";

const router = Router();

router.use(authenticate, requireSuperAdmin);
router.get("/", usersController.list);
router.post("/", usersController.create);
router.patch("/:id/permissions", usersController.updatePermissions);
router.patch("/:id", usersController.update);
router.delete("/:id", usersController.deleteUser);

export default router;
