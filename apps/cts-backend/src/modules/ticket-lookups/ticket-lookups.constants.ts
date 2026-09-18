export const TICKET_LOOKUP_KINDS = ["courier", "issue", "status"] as const;

export type TicketLookupKind = (typeof TICKET_LOOKUP_KINDS)[number];
