export const REFUND_LOOKUP_KINDS = [
  "type",
  "sales_channel",
  "currency",
  "reason",
  "tag",
  "accountable",
] as const;

export type RefundLookupKind = (typeof REFUND_LOOKUP_KINDS)[number];

export const REFUND_LOOKUP_COLUMNS: Record<RefundLookupKind, string> = {
  type: "type",
  sales_channel: "sales_channel",
  currency: "refund_currency",
  reason: "reason",
  tag: "tags",
  accountable: "accountable",
};

export const REFUND_LOOKUP_ERRORS: Record<RefundLookupKind, string> = {
  type: "INVALID_TYPE",
  sales_channel: "INVALID_SALES_CHANNEL",
  currency: "INVALID_CURRENCY",
  reason: "INVALID_REASON",
  tag: "INVALID_TAG",
  accountable: "INVALID_ACCOUNTABLE",
};
