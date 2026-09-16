import type { Request, Response } from "express";
import { usersService } from "./users.service.js";
import {
  createUserSchema,
  updateUserPermissionsSchema,
  updateUserSchema,
} from "./users.schema.js";

export const usersController = {
  async list(_req: Request, res: Response) {
    try {
      const users = await usersService.list();
      return res.json({ success: true, data: users });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const user = await usersService.create(parsed.data);
      return res.status(201).json({ success: true, data: user });
    } catch (e: any) {
      if (e.message === "USER_ALREADY_EXISTS") {
        return res.status(400).json({ success: false, error: "USER_ALREADY_EXISTS" });
      }
      if (e.message === "ROLE_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "ROLE_NOT_FOUND" });
      }
      if (e.message === "DEPARTMENT_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "DEPARTMENT_NOT_FOUND" });
      }
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async deleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    try {
      await usersService.delete(id);
      return res.json({ success: true });
    } catch (e: any) {
      if (e.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      }
      if (e.message === "SUPER_ADMIN_LOCKED") {
        return res.status(400).json({ success: false, error: "SUPER_ADMIN_LOCKED" });
      }
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const user = await usersService.update(id, parsed.data);
      return res.json({ success: true, data: user });
    } catch (e: any) {
      if (e.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      }
      if (e.message === "ROLE_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "ROLE_NOT_FOUND" });
      }
      if (e.message === "DEPARTMENT_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "DEPARTMENT_NOT_FOUND" });
      }
      if (e.message === "SUPER_ADMIN_LOCKED") {
        return res.status(400).json({ success: false, error: "SUPER_ADMIN_LOCKED" });
      }
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async updatePermissions(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    const parsed = updateUserPermissionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const user = await usersService.updatePermissions(id, parsed.data);
      return res.json({ success: true, data: user });
    } catch (e: any) {
      if (e.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      }
      if (e.message === "ROLE_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "ROLE_NOT_FOUND" });
      }
      if (e.message === "PERMISSION_NOT_FOUND") {
        return res.status(400).json({ success: false, error: "PERMISSION_NOT_FOUND" });
      }
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
