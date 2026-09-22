import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (value === "" || value === undefined) return undefined;
  return value;
}

function emptyToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  return value;
}

export const createTicketSchema = z.object({
  orderId: z.string().trim().min(1, "Order ID is required"),
  courier: z.string().trim().min(1, "Courier is required"),
  trackingNumber: z.string().trim().min(1, "Tracking number is required"),
  issue: z.string().trim().min(1, "Issue is required"),
  comment: z.preprocess(emptyToUndefined, z.string().optional().default("")),
  assignedDepartmentId: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable()),
  status: z.preprocess(
    emptyToUndefined,
    z.string().trim().optional().default("Not Started")
  ),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

function queryString(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  return emptyToUndefined(typeof raw === "string" ? raw.trim() : raw);
}

const optionalQueryString = z.preprocess(queryString, z.string().min(1).optional());
const optionalQueryDate = z.preprocess(
  queryString,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional()
);

export const ticketSortFields = [
  "ticketDate",
  "id",
  "orderId",
  "courier",
  "trackingNumber",
  "issue",
  "status",
  "assignedTo",
  "createdBy",
  "modifiedBy",
  "closedBy",
] as const;

export const listTicketsQuerySchema = z
  .object({
    courier: optionalQueryString,
    issue: optionalQueryString,
    status: optionalQueryString,
    assignedTo: optionalQueryString,
    createdBy: optionalQueryString,
    modifiedBy: optionalQueryString,
    fromDate: optionalQueryDate,
    toDate: optionalQueryDate,
    page: z.preprocess(queryString, z.coerce.number().int().min(0).default(0)),
    pageSize: z.preprocess(
      queryString,
      z.coerce.number().int().min(1).max(100).default(25)
    ),
    sortBy: z.preprocess(queryString, z.enum(ticketSortFields).default("ticketDate")),
    sortDirection: z.preprocess(
      queryString,
      z.enum(["asc", "desc"]).default("desc")
    ),
  })
  .refine((data) => !data.fromDate || !data.toDate || data.fromDate <= data.toDate, {
    message: "INVALID_DATE_RANGE",
    path: ["toDate"],
  });

export type TicketListFilters = z.infer<typeof listTicketsQuerySchema>;

export const ticketIdParamSchema = z.object({
  ticketId: z.string().trim().min(1),
});

export const updateTicketSchema = z.object({
  status: z.string().trim().min(1, "Status is required"),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

function textFromHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const createReplySchema = z.object({
  comment: z
    .string()
    .trim()
    .refine((value) => textFromHtml(value).length > 0, "Description is required"),
  assignedDepartmentId: z.coerce.number().int().positive("Assigned to is required"),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
