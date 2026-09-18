import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import meRoutes from "../modules/me/me.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import departmentsRoutes from "../modules/departments/departments.routes.js";
import ticketsRoutes from "../modules/tickets/tickets.routes.js";
import ticketLookupsRoutes from "../modules/ticket-lookups/ticket-lookups.routes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/departments", departmentsRoutes);
router.use("/tickets", ticketsRoutes);
router.use("/ticket-lookups", ticketLookupsRoutes);
export default router;
