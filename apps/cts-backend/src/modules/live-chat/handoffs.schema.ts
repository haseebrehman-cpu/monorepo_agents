import { z } from "zod";
import { DEFAULT_CHANNEL, HANDOFF_LIMITS as L } from "./live-chat.constants.js";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const LINE_BREAKS_AND_CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g;

function nullToUndefined(value: unknown) {
  return value === null ? undefined : value;
}

function singleLine(max: number, min = 0) {
  return z
    .string()
    .transform((value) => value.replace(LINE_BREAKS_AND_CONTROL_CHARS, " ").trim())
    .pipe(z.string().min(min, "Required").max(max));
}

function multiLine(max: number, min = 0) {
  return z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "").trim())
    .pipe(z.string().min(min, "Required").max(max));
}

function optionalSingleLine(max: number) {
  return z.preprocess(nullToUndefined, singleLine(max).default(""));
}

export const createHandoffSchema = z.object({
    conversationId: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]+$/, "Invalid conversation id")
      .max(L.conversationId),
    customerName: singleLine(L.customerName, 1),
    customerEmail: z.string().trim().toLowerCase().pipe(z.email().max(L.email)),
    channel: optionalSingleLine(L.channel).transform((value) => value || DEFAULT_CHANNEL),
    orderNumber: z
      .preprocess(nullToUndefined, singleLine(L.orderNumber).optional())
      .transform((value) => value || null),
    handoffReason: multiLine(L.handoffReason, 1),
    aiSummary: multiLine(L.aiSummary, 1),
    location: optionalSingleLine(L.location),
    tags: z
      .preprocess(
        nullToUndefined,
        z
          .array(z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{1,32}$/, "Invalid tag"))
          .max(L.tagCount)
          .default([])
      )
      .transform((tags) => [...new Set(tags)]),
  });

export type CreateHandoffInput = z.infer<typeof createHandoffSchema>;
