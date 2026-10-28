import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { authenticate, requirePermission } from "../../core/auth.middleware.js";
import { P } from "../../config/features.js";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "./refunds.constants.js";
import { refundsController } from "./refunds.controller.js";

const MAX_FORM_FIELDS = 100;
const MAX_FORM_FIELD_BYTES = 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_ATTACHMENT_BYTES,
    files: MAX_ATTACHMENTS,
    fields: MAX_FORM_FIELDS,
    fieldSize: MAX_FORM_FIELD_BYTES,
    parts: MAX_ATTACHMENTS + MAX_FORM_FIELDS,
  },
  fileFilter(_req, file, callback) {
    if (ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) return callback(null, true);
    callback(Object.assign(new Error("INVALID_ATTACHMENT_TYPE"), { code: "INVALID_ATTACHMENT_TYPE" }));
  },
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
    if (code === "INVALID_ATTACHMENT_TYPE") {
      return res.status(400).json({ success: false, error: "INVALID_ATTACHMENT_TYPE" });
    }
    return res.status(400).json({ success: false, error: "INVALID_ATTACHMENT" });
  });
}

const router = Router();

router.use(authenticate);
router.get("/", requirePermission(P.REFUND_ACCESS), refundsController.list);
router.get("/options", requirePermission(P.REFUND_ACCESS), refundsController.options);
router.get(
  "/attachments/:attachmentId",
  requirePermission(P.REFUND_ACCESS),
  refundsController.downloadAttachment
);
router.get("/:refundId", requirePermission(P.REFUND_ACCESS), refundsController.get);
router.post(
  "/",
  requirePermission(P.REFUND_CREATE),
  uploadAttachments,
  refundsController.create
);

export default router;
