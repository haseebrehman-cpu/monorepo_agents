import type { Request, Response } from "express";
import {
  createResendLookupSchema,
  updateResendLookupSchema,
} from "./resend-lookups.schema.js";
import { resendLookupsService } from "./resend-lookups.service.js";

function lookupError(res: Response, error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "LOOKUP_ALREADY_EXISTS" || code === "LOOKUP_IN_USE") {
    return res.status(400).json({ success: false, error: code });
  }
  if (code === "LOOKUP_NOT_FOUND") {
    return res.status(404).json({ success: false, error: code });
  }
  console.error("[resend-lookups] failed:", error);
  return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
}

export const resendLookupsController = {
  async list(_req: Request, res: Response) {
    try {
      const lookups = await resendLookupsService.list();
      return res.json({ success: true, data: lookups });
    } catch (error) {
      return lookupError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createResendLookupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const lookup = await resendLookupsService.create(parsed.data);
      return res.status(201).json({ success: true, data: lookup });
    } catch (error) {
      return lookupError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    const parsed = updateResendLookupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const lookup = await resendLookupsService.update(id, parsed.data);
      return res.json({ success: true, data: lookup });
    } catch (error) {
      return lookupError(res, error);
    }
  },

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    try {
      await resendLookupsService.remove(id);
      return res.json({ success: true });
    } catch (error) {
      return lookupError(res, error);
    }
  },
};
