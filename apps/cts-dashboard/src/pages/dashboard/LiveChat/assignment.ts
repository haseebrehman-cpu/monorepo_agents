import type { LiveConversation, QueueFilter, SupportMember } from "./types.js";

export const MIN_QUEUE_LIMIT = 1;
export const MAX_QUEUE_LIMIT = 12;

export function memberName(members: SupportMember[], id: string | null) {
  if (!id) return null;
  return members.find((member) => member.id === id)?.name ?? "Agent";
}

export function queuedFor(conversations: LiveConversation[], memberId: string) {
  return conversations.filter(
    (conversation) => conversation.status === "waiting" && conversation.queuedForId === memberId,
  ).length;
}

export function activeFor(conversations: LiveConversation[], memberId: string) {
  return conversations.filter(
    (conversation) => conversation.status === "active" && conversation.ownerId === memberId,
  ).length;
}

export function workloadFor(conversations: LiveConversation[], memberId: string) {
  return queuedFor(conversations, memberId) + activeFor(conversations, memberId);
}

/** Mirrors the server: agents see unassigned waiting chats, their queued chats, and chats they own. */
export function canSeeConversation(conversation: LiveConversation, isAdmin: boolean, viewerId: string) {
  if (isAdmin) return true;
  if (conversation.status === "waiting") {
    return conversation.queuedForId === null || conversation.queuedForId === viewerId;
  }
  return conversation.ownerId === viewerId;
}

export function matchesInbox(
  conversation: LiveConversation,
  filter: QueueFilter,
  viewerId: string,
  isDeskAdmin: boolean,
) {
  if (filter === "user_queue") return conversation.status === "waiting" && conversation.queuedForId === null;
  if (filter === "active") {
    return (
      (conversation.status === "active" && conversation.ownerId === viewerId) ||
      (conversation.status === "waiting" && conversation.queuedForId === viewerId)
    );
  }
  if (filter === "team") {
    return (
      isDeskAdmin &&
      ((conversation.status === "active" && conversation.ownerId !== viewerId) ||
        (conversation.status === "waiting" &&
          conversation.queuedForId !== null &&
          conversation.queuedForId !== viewerId))
    );
  }
  return conversation.status === "resolved" && (isDeskAdmin || conversation.ownerId === viewerId);
}

/**
 * Agents take only waiting chats queued to them. Admins can also take any
 * waiting chat, or take over an active chat someone else owns.
 */
export function canTakeConversation(
  conversation: LiveConversation,
  viewerId: string,
  isDeskAdmin: boolean,
  canAssign: boolean,
) {
  if (!canAssign) return false;
  if (conversation.status === "waiting") return isDeskAdmin || conversation.queuedForId === viewerId;
  return isDeskAdmin && conversation.status === "active" && conversation.ownerId !== viewerId;
}

export function assigneeId(conversation: LiveConversation) {
  return conversation.status === "waiting" ? conversation.queuedForId : conversation.ownerId;
}

export function lastPreview(conversation: LiveConversation) {
  const message = conversation.messagesLoaded
    ? [...conversation.messages].reverse().find((entry) => entry.author !== "system")
    : (conversation.lastMessage ?? undefined);
  if (!message) return "Handed off from the AI assistant";
  if (message.author === "note") return `Note: ${message.body}`;
  return message.body;
}
