import { z } from "zod";
import { MAX_MESSAGE_BODY, MAX_QUEUE_LIMIT, MIN_QUEUE_LIMIT } from "./live-chat.constants.js";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const queueLimit = z.number().int().min(MIN_QUEUE_LIMIT).max(MAX_QUEUE_LIMIT);

export const conversationParamsSchema = z.object({ conversationId: z.uuid() });
export const memberParamsSchema = z.object({ memberId: z.coerce.number().int().positive() });

export const updatePresenceSchema = z
  .object({
    accepting: z.boolean().optional(),
    limit: queueLimit.optional(),
  })
  .refine((input) => input.accepting !== undefined || input.limit !== undefined, {
    message: "Nothing to update",
  });

export const updateMemberSchema = z.object({ limit: queueLimit });

export const transferSchema = z.object({ memberId: z.coerce.number().int().positive() });

export const sendMessageSchema = z.object({
  kind: z.enum(["reply", "note"]),
  body: z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").replace(CONTROL_CHARS, "").trim())
    .pipe(
      z
        .string()
        .min(1, "Required")
        .max(MAX_MESSAGE_BODY)
        .refine((value) => !value.startsWith("/"), "Pick a saved reply or remove the leading /")
    ),
});

export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
