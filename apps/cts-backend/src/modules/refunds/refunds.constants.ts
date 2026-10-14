export const ITEM_RETURNED_OPTIONS = ["True", "False"] as const;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export function canonicalItemReturned(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") return "True";
  if (normalized === "false" || normalized === "no") return "False";
  throw new Error("INVALID_ITEM_RETURNED");
}
