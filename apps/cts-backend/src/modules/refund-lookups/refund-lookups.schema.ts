import { z } from "zod";
import { REFUND_LOOKUP_KINDS } from "./refund-lookups.constants.js";

export const createRefundLookupSchema = z.object({
  kind: z.enum(REFUND_LOOKUP_KINDS),
  label: z.string().trim().min(1, "Label is required").max(80),
});

export const updateRefundLookupSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export type CreateRefundLookupInput = z.infer<typeof createRefundLookupSchema>;
export type UpdateRefundLookupInput = z.infer<typeof updateRefundLookupSchema>;
