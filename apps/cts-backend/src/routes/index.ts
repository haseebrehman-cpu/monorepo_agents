import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import meRoutes from "../modules/me/me.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/departments", departmentsRoutes);
export default router;
