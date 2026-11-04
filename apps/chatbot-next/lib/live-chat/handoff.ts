import type { SupportReply } from "@rdx/chat-contract";

export interface LiveChatHandoff {
  handoffId: string;
  reference: string;
  /** Set when the assistant reply already carried a customer token. */
  token: string | null;
}

/**
 * A reply that handed the chat to a person. A token on the reply is used as-is.
 * Otherwise the handoff id is enough: the widget asks the live chat API for a token.
 */
export function liveChatHandoffFromReply(
  reply: SupportReply,
  configured: boolean,
): LiveChatHandoff | null {
  const handoff = reply.handoff;
  if (!configured || !handoff?.reference || !handoff.handoff_id) return null;
  const token = handoff.customer_token?.trim() || null;
  const liveChannel = handoff.channel?.trim().toLowerCase() === "livechat";
  if (!token && !liveChannel) return null;
  return { handoffId: handoff.handoff_id, reference: handoff.reference, token };
}
