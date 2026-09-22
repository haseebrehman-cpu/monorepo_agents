export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;

export const MAX_BULK_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_BULK_TICKET_ROWS = 500;
export const ALLOWED_BULK_FILE_EXTENSIONS = new Set([".csv", ".xls", ".xlsx"]);
export const ALLOWED_BULK_FILE_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);
