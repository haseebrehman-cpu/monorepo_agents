import type { Request, Response } from "express";
import { meService } from "./me.service.js";

export const meController = {
  async config(req: Request, res: Response) {
    try {
      const config = await meService.getConfig(req.user!.userId);
      return res.json({ success: true, ...config });
    } catch (e: any) {
      console.error("[/me/config] error:", e);
      if (e.message === "USER_NOT_FOUND") {
        return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
      }
      return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
  },
};