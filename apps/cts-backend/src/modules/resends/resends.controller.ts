import type { Request, Response } from "express";
import { contentMatchesMimeType } from "../../core/file-signature.js";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "../refunds/refunds.constants.js";
import { createResendSchema, listResendsQuerySchema, resendIdParamSchema } from "./resends.schema.js";
import { resendsService, type ResendAttachmentInput } from "./resends.service.js";

function filesFromRequest(req: Request): ResendAttachmentInput[] {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => ({
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    fileData: file.buffer,
  }));
}

function validateAttachments(files: ResendAttachmentInput[]) {
  if (files.length > MAX_ATTACHMENTS) return "TOO_MANY_ATTACHMENTS";
  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimeType)) return "INVALID_ATTACHMENT_TYPE";
    if (file.sizeBytes > MAX_ATTACHMENT_BYTES) return "ATTACHMENT_TOO_LARGE";
    if (!contentMatchesMimeType(file.mimeType, file.fileData)) return "INVALID_ATTACHMENT_TYPE";
  }
  return null;
}

const LOOKUP_ERRORS = new Set([
  "INVALID_TYPE",
  "INVALID_SALES_CHANNEL",
  "INVALID_COUNTRY",
  "INVALID_REASON",
  "INVALID_TAG",
  "INVALID_ACCOUNTABLE",
  "INVALID_ITEM_RETURNED",
]);

function safeFilename(name: string) {
  return name.replace(/["\r\n]/g, "_");
}

export const resendsController = {
  async list(req: Request, res: Response) {
    const parsed = listResendsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const resends = await resendsService.list(parsed.data);
      return res.json({ success: true, data: resends });
    } catch (error) {
      console.error("[resends.list] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async options(_req: Request, res: Response) {
    try {
      const options = await resendsService.options();
      return res.json({ success: true, data: options });
    } catch (error) {
      console.error("[resends.options] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async get(req: Request, res: Response) {
    const parsed = resendIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const resend = await resendsService.getByRef(parsed.data.resendId);
      if (!resend) {
        return res.status(404).json({ success: false, error: "RESEND_NOT_FOUND" });
      }
      return res.json({ success: true, data: resend });
    } catch (error) {
      console.error("[resends.get] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async downloadAttachment(req: Request, res: Response) {
    const attachmentId = Number(req.params.attachmentId);
    if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const file = await resendsService.getAttachment(attachmentId);
      if (!file) {
        return res.status(404).json({ success: false, error: "ATTACHMENT_NOT_FOUND" });
      }

      const data = Buffer.isBuffer(file.file_data)
        ? file.file_data
        : Buffer.from(file.file_data);
      res.setHeader("Content-Type", file.mime_type || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename(file.file_name)}"`
      );
      res.setHeader("Content-Length", String(data.length));
      return res.send(data);
    } catch (error) {
      console.error("[resends.downloadAttachment] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    const files = filesFromRequest(req);
    const attachmentError = validateAttachments(files);
    if (attachmentError) {
      return res.status(400).json({ success: false, error: attachmentError });
    }

    const parsed = createResendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const resend = await resendsService.create(parsed.data, req.user.userId, files);
      return res.status(201).json({ success: true, data: resend });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (LOOKUP_ERRORS.has(message)) {
        return res.status(400).json({ success: false, error: message });
      }
      console.error("[resends.create] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
