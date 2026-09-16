import type { Request, Response } from "express";
import { rolesService } from "./roles.service.js";

export const rolesController = {
  async list(_req: Request, res: Response) {
    try {
      const roles = await rolesService.list();
      return res.json({ success: true, data: roles });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async listPermissions(_req: Request, res: Response) {
    try {
      const permissions = await rolesService.listPermissions();
      return res.json({ success: true, data: permissions });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async listFeatures(_req: Request, res: Response) {
    try {
      const features = await rolesService.listFeatures();
      return res.json({ success: true, data: features });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
