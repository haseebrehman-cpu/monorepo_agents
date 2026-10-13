import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { authenticate, requirePermission } from "../../core/auth.middleware.js";
import { P } from "../../config/features.js";
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS } from "./refunds.constants.js";
import { refundsController } from "./refunds.controller.js";

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
