export const ITEM_RETURNED_OPTIONS = ["True", "False"] as const;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export function canonicalItemReturned(value: boolean) {
  return value ? "True" : "False";
}
