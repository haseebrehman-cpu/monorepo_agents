import { z } from "zod";
import { TICKET_LOOKUP_KINDS } from "./ticket-lookups.constants.js";

export const createTicketLookupSchema = z.object({
  kind: z.enum(TICKET_LOOKUP_KINDS),
  label: z.string().trim().min(1, "Label is required").max(80),
  isClosed: z.boolean().optional().default(false),
});

export const updateTicketLookupSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
  isClosed: z.boolean().optional(),
});

export type CreateTicketLookupInput = z.infer<typeof createTicketLookupSchema>;
export type UpdateTicketLookupInput = z.infer<typeof updateTicketLookupSchema>;
