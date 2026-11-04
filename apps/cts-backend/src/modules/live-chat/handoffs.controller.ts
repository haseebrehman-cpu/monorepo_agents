import type { Request, Response } from "express";
import { createHandoffSchema } from "./handoffs.schema.js";
import { handoffsService } from "./handoffs.service.js";
import { issueCustomerToken } from "./customer-token.js";

export const handoffsController = {
  async create(req: Request, res: Response) {
    const parsed = createHandoffSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_HANDOFF",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    try {
      const { created, handoff } = await handoffsService.create(parsed.data);
      return res.status(created ? 201 : 200).json({
        success: true,
        data: { ...handoff, customerToken: issueCustomerToken(handoff.id) },
      });
    } catch (error) {
      console.error("[liveChat.handoffs.create] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
