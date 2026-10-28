export const RESEND_LOOKUP_KINDS = [
  "type",
  "sales_channel",
  "reason",
  "tag",
  "accountable",
] as const;

export type ResendLookupKind = (typeof RESEND_LOOKUP_KINDS)[number];

export const RESEND_LOOKUP_COLUMNS: Record<ResendLookupKind, string> = {
  type: "type",
  sales_channel: "sales_channel",
  reason: "reason",
  tag: "tags",
  accountable: "accountable",
};

export const RESEND_LOOKUP_ERRORS: Record<ResendLookupKind, string> = {
  type: "INVALID_TYPE",
  sales_channel: "INVALID_SALES_CHANNEL",
  reason: "INVALID_REASON",
  tag: "INVALID_TAG",
  accountable: "INVALID_ACCOUNTABLE",
};
