import type { Request, Response } from "express";
import { departmentsService } from "./departments.service.js";

export const departmentsController = {
  async list(_req: Request, res: Response) {
    try {
      const departments = await departmentsService.list();
      return res.json({ success: true, data: departments });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
