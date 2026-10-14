import type { Request, Response } from "express";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "./refunds.constants.js";
import { createRefundSchema, listRefundsQuerySchema, refundIdParamSchema } from "./refunds.schema.js";
import { refundsService, type RefundAttachmentInput } from "./refunds.service.js";

function filesFromRequest(req: Request): RefundAttachmentInput[] {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => ({
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    fileData: file.buffer,
  }));
}

function validateAttachments(files: RefundAttachmentInput[]) {
  if (files.length > MAX_ATTACHMENTS) return "TOO_MANY_ATTACHMENTS";
  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimeType)) return "INVALID_ATTACHMENT_TYPE";
    if (file.sizeBytes > MAX_ATTACHMENT_BYTES) return "ATTACHMENT_TOO_LARGE";
  }
  return null;
}

function lookupErrorStatus(message: string) {
  if (
    message === "INVALID_TYPE" ||
    message === "INVALID_SALES_CHANNEL" ||
    message === "INVALID_CURRENCY" ||
    message === "INVALID_COUNTRY" ||
    message === "INVALID_COURIER" ||
    message === "INVALID_REASON" ||
    message === "INVALID_TAG" ||
    message === "INVALID_ACCOUNTABLE" ||
    message === "INVALID_ITEM_RETURNED"
  ) {
    return 400;
  }
  return 500;
}

function safeFilename(name: string) {
  return name.replace(/["\r\n]/g, "_");
}

export const refundsController = {
  async list(req: Request, res: Response) {
    const parsed = listRefundsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const refunds = await refundsService.list(parsed.data);
      return res.json({ success: true, data: refunds });
    } catch (error) {
      console.error("[refunds.list] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async options(_req: Request, res: Response) {
    try {
      const options = await refundsService.options();
      return res.json({ success: true, data: options });
    } catch (error) {
      console.error("[refunds.options] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async get(req: Request, res: Response) {
    const parsed = refundIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const refund = await refundsService.getByRef(parsed.data.refundId);
      if (!refund) {
        return res.status(404).json({ success: false, error: "REFUND_NOT_FOUND" });
      }
      return res.json({ success: true, data: refund });
    } catch (error) {
      console.error("[refunds.get] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async downloadAttachment(req: Request, res: Response) {
    const attachmentId = Number(req.params.attachmentId);
    if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const file = await refundsService.getAttachment(attachmentId);
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
      console.error("[refunds.downloadAttachment] failed:", error);
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

    const parsed = createRefundSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const refund = await refundsService.create(parsed.data, req.user.userId, files);
      return res.status(201).json({ success: true, data: refund });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const status = lookupErrorStatus(message);
      if (status !== 500) {
        return res.status(status).json({ success: false, error: message });
      }
      console.error("[refunds.create] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
