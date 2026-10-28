import { z } from "zod";
import { RESEND_LOOKUP_KINDS } from "./resend-lookups.constants.js";

export const createResendLookupSchema = z.object({
  kind: z.enum(RESEND_LOOKUP_KINDS),
  label: z.string().trim().min(1, "Label is required").max(80),
});

export const updateResendLookupSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export type CreateResendLookupInput = z.infer<typeof createResendLookupSchema>;
export type UpdateResendLookupInput = z.infer<typeof updateResendLookupSchema>;
