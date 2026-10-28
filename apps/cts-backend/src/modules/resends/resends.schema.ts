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

export const createResendSchema = z.object({
    category: requiredText,
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
})

export type CreateResendInput = z.infer<typeof createResendSchema>;

function queryString(value: unknown) {
    const raw = Array.isArray(value) ? value[0] : value;
    if(typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed || undefined;
}

const optionalQueryString = z.preprocess(queryString, z.string().min(1).optional());

export const resendSortFields = [
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
    "shippingCost",
    "country",
    "courierService",
    "trackingNumber",
    "reason",
    "tags",
    "accountable",
    "itemReturned",
    "buyerComment",
    "comment",
    "issueListing",
    "issueWarehouse",
    "issueLogistics",
    "issueFactory",
] as const;

export const listResendsQuerySchema = z.object({
    category: optionalText,
    referenceNo: optionalText,
    orderId: optionalQueryString,
    categoryName: optionalQueryString,
    email: optionalQueryString,
    type: optionalText,
    salesChannel: optionalText,
    sku: optionalText,
    title: optionalText,
    quantity: optionalQueryString,
    salePrice: optionalQueryString,
    shippingCost: optionalQueryString,
    country: optionalText,
    courierService: optionalQueryString,
    trackingNumber: optionalQueryString,
    reason: optionalText,
    tags: optionalText,
    accountable: optionalText,
    itemReturned: optionalText,
})

export type ResendListFilters = z.infer<typeof listResendsQuerySchema>;

export const resendIdParamSchema = z.object({
    resendId: z.string().trim().min(1),
});