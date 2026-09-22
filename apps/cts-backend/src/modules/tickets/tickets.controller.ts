import type { Request, Response } from "express";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "./tickets.constants.js";
import {
  BulkTicketFileError,
  parseBulkTicketFile,
} from "./tickets-bulk.parser.js";
import {
  createReplySchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
  updateTicketSchema,
} from "./tickets.schema.js";
import {
  BulkTicketValidationError,
  ticketsService,
  type TicketAttachmentInput,
} from "./tickets.service.js";

function filesFromRequest(req: Request): TicketAttachmentInput[] {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => ({
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    fileData: file.buffer,
  }));
}

function validateAttachments(files: TicketAttachmentInput[]) {
  if (files.length > MAX_ATTACHMENTS) {
    return "TOO_MANY_ATTACHMENTS";
  }
  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimeType)) {
      return "INVALID_ATTACHMENT_TYPE";
    }
    if (file.sizeBytes > MAX_ATTACHMENT_BYTES) {
      return "ATTACHMENT_TOO_LARGE";
    }
  }
  return null;
}

function lookupErrorStatus(message: string) {
  if (
    message === "ORDER_ID_ALREADY_EXISTS" ||
    message === "TRACKING_NUMBER_ALREADY_EXISTS"
  ) {
    return 409;
  }
  if (
    message === "ASSIGNEE_NOT_FOUND" ||
    message === "DEPARTMENT_NOT_FOUND" ||
    message === "INVALID_COURIER" ||
    message === "INVALID_ISSUE" ||
    message === "INVALID_STATUS"
  ) {
    return 400;
  }
  return 500;
}

function safeFilename(name: string) {
  return name.replace(/["\r\n]/g, "_");
}

export const ticketsController = {
  async list(req: Request, res: Response) {
    const parsed = listTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const tickets = await ticketsService.list(parsed.data);
      return res.json({ success: true, data: tickets });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async options(_req: Request, res: Response) {
    try {
      const options = await ticketsService.options();
      return res.json({ success: true, data: options });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async get(req: Request, res: Response) {
    const parsed = ticketIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const ticket = await ticketsService.getByRef(parsed.data.ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, error: "TICKET_NOT_FOUND" });
      }
      return res.json({ success: true, data: ticket });
    } catch {
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async update(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    const params = ticketIdParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const ticket = await ticketsService.updateStatus(
        params.data.ticketId,
        parsed.data.status,
        req.user.userId
      );
      if (!ticket) {
        return res.status(404).json({ success: false, error: "TICKET_NOT_FOUND" });
      }
      return res.json({ success: true, data: ticket });
    } catch (e: any) {
      const status = lookupErrorStatus(e.message);
      if (status !== 500) {
        return res.status(status).json({ success: false, error: e.message });
      }
      console.error("[tickets.update] failed:", e);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async reply(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }

    const params = ticketIdParamSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    const files = filesFromRequest(req);
    const attachmentError = validateAttachments(files);
    if (attachmentError) {
      return res.status(400).json({ success: false, error: attachmentError });
    }

    const parsed = createReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const ticket = await ticketsService.addReply(
        params.data.ticketId,
        parsed.data,
        req.user.userId,
        files
      );
      if (!ticket) {
        return res.status(404).json({ success: false, error: "TICKET_NOT_FOUND" });
      }
      return res.status(201).json({ success: true, data: ticket });
    } catch (e: any) {
      const status = lookupErrorStatus(e.message);
      if (status !== 500) {
        return res.status(status).json({ success: false, error: e.message });
      }
      console.error("[tickets.reply] failed:", e);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async downloadAttachment(req: Request, res: Response) {
    const attachmentId = Number(req.params.attachmentId);
    if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const file = await ticketsService.getAttachment(attachmentId);
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
    } catch {
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

    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }

    try {
      const ticket = await ticketsService.create(parsed.data, req.user.userId, files);
      return res.status(201).json({ success: true, data: ticket });
    } catch (e: any) {
      const status = lookupErrorStatus(e.message);
      if (status !== 500) {
        return res.status(status).json({ success: false, error: e.message });
      }
      console.error("[tickets.create] failed:", e);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async remove(req: Request, res: Response) {
    const parsed = ticketIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }

    try {
      const deleted = await ticketsService.remove(parsed.data.ticketId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "TICKET_NOT_FOUND" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("[tickets.remove] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },

  async bulkCreate(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "BULK_FILE_REQUIRED" });
    }

    try {
      const rows = parseBulkTicketFile(req.file.originalname, req.file.buffer);
      const result = await ticketsService.bulkCreate(rows, req.user.userId);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (
        error instanceof BulkTicketFileError ||
        error instanceof BulkTicketValidationError
      ) {
        const status = error.message === "BULK_VALIDATION_FAILED" ? 422 : 400;
        return res.status(status).json({
          success: false,
          error: error.message,
          details: error.details,
        });
      }
      if (
        error instanceof Error &&
        (error.message === "ORDER_ID_ALREADY_EXISTS" ||
          error.message === "TRACKING_NUMBER_ALREADY_EXISTS")
      ) {
        return res.status(409).json({ success: false, error: error.message });
      }
      console.error("[tickets.bulkCreate] failed:", error);
      return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
    }
  },
};
