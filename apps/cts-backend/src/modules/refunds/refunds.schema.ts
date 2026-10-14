import { z } from "zod";

function emptyToDefault(value: unknown) {
  if (value === "" || value === undefined || value === null) return "";
  return value;
}

function formBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "on", "yes"].includes(value.trim().toLowerCase());
  }
  return false;
}

const requiredText = z.string().trim().min(1);
const optionalText = z.preprocess(emptyToDefault, z.string().trim());
const money = z.coerce.number().nonnegative().finite();

export const createRefundSchema = z.object({
  referenceNo: requiredText,
  orderId: optionalText,
  categoryName: optionalText,
  email: optionalText.refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Email is invalid"
  ),
  type: requiredText,
  salesChannel: requiredText,
  sku: requiredText,
  title: requiredText,
  quantity: z.coerce.number().int().positive(),
  salePrice: requiredText,
  refundCurrency: requiredText,
  refundPrice: money,
  shippingCost: money,
  country: requiredText,
  courierService: optionalText,
  trackingNumber: optionalText,
  reason: requiredText,
  tags: requiredText,
  accountable: requiredText,
  itemReturned: requiredText,
  buyerComment: requiredText,
  comment: requiredText,
  issueListing: z.preprocess(formBoolean, z.boolean()),
  issueWarehouse: z.preprocess(formBoolean, z.boolean()),
  issueLogistics: z.preprocess(formBoolean, z.boolean()),
  issueFactory: z.preprocess(formBoolean, z.boolean()),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

function queryString(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

const optionalQueryString = z.preprocess(queryString, z.string().min(1).optional());

export const refundSortFields = [
  "createdAt",
  "referenceNo",
  "orderId",
  "categoryName",
  "email",
  "type",
  "salesChannel",
  "sku",
  "title",
  "quantity",
  "salePrice",
  "refundCurrency",
  "refundPrice",
  "shippingCost",
  "country",
  "courierService",
  "trackingNumber",
  "reason",
  "tags",
  "accountable",
  "itemReturned",
] as const;

export const listRefundsQuerySchema = z.object({
  type: optionalQueryString,
  salesChannel: optionalQueryString,
  refundCurrency: optionalQueryString,
  country: optionalQueryString,
  courierService: optionalQueryString,
  reason: optionalQueryString,
  tags: optionalQueryString,
  accountable: optionalQueryString,
  itemReturned: optionalQueryString,
  page: z.preprocess(queryString, z.coerce.number().int().min(0).default(0)),
  pageSize: z.preprocess(queryString, z.coerce.number().int().min(1).max(100).default(25)),
  sortBy: z.preprocess(queryString, z.enum(refundSortFields).default("createdAt")),
  sortDirection: z.preprocess(queryString, z.enum(["asc", "desc"]).default("desc")),
});

export type RefundListFilters = z.infer<typeof listRefundsQuerySchema>;

export const refundIdParamSchema = z.object({
  refundId: z.string().trim().min(1),
});
