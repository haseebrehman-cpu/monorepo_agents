import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { authenticate, requirePermission } from "../../core/auth.middleware.js";
import { P } from "../../config/features.js";
import {
  ALLOWED_BULK_FILE_EXTENSIONS,
  ALLOWED_BULK_FILE_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAX_BULK_FILE_BYTES,
} from "./tickets.constants.js";
import { ticketsController } from "./tickets.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENTS },
});

function uploadAttachments(req: Request, res: Response, next: NextFunction) {
  upload.array("attachments", MAX_ATTACHMENTS)(req, res, (err: unknown) => {
    if (!err) return next();
    const code =
      typeof err === "object" && err && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "ATTACHMENT_TOO_LARGE" });
    }
    if (code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ success: false, error: "TOO_MANY_ATTACHMENTS" });
    }
    return res.status(400).json({ success: false, error: "INVALID_ATTACHMENT" });
  });
}

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BULK_FILE_BYTES, files: 1 },
});

function uploadBulkTickets(req: Request, res: Response, next: NextFunction) {
  bulkUpload.single("file")(req, res, (err: unknown) => {
    if (err) {
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "BULK_FILE_TOO_LARGE" });
      }
      return res.status(400).json({ success: false, error: "INVALID_BULK_FILE" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "BULK_FILE_REQUIRED" });
    }
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (
      !ALLOWED_BULK_FILE_EXTENSIONS.has(extension) ||
      !ALLOWED_BULK_FILE_TYPES.has(req.file.mimetype)
    ) {
      return res.status(400).json({ success: false, error: "INVALID_BULK_FILE_TYPE" });
    }
    return next();
  });
}

const router = Router();

router.use(authenticate);
router.get("/", requirePermission(P.TRACKING_ACCESS), ticketsController.list);
router.get(
  "/options",
  requirePermission(P.TRACKING_ACCESS, P.TRACKING_ADD),
  ticketsController.options
);
router.post(
  "/bulk",
  requirePermission(P.TRACKING_ADD_BULK),
  uploadBulkTickets,
  ticketsController.bulkCreate
);
router.get(
  "/attachments/:attachmentId",
  requirePermission(P.TRACKING_ACCESS),
  ticketsController.downloadAttachment
);
router.get("/:ticketId", requirePermission(P.TRACKING_ACCESS), ticketsController.get);
router.patch("/:ticketId", requirePermission(P.TRACKING_ACCESS), ticketsController.update);
router.delete(
  "/:ticketId",
  requirePermission(P.TRACKING_DELETE),
  ticketsController.remove
);
router.post(
  "/:ticketId/replies",
  requirePermission(P.TRACKING_ACCESS),
  uploadAttachments,
  ticketsController.reply
);
router.post("/", requirePermission(P.TRACKING_ADD), uploadAttachments, ticketsController.create);

export default router;
