import type { LiveConversation, SupportMember } from "./types";

export const VIEWER_ID = "you";
export const SUPPORT_ADMIN_ID = "support-admin";
export const MIN_QUEUE_LIMIT = 1;
export const MAX_QUEUE_LIMIT = 12;

export function createSupportTeam(name: string): SupportMember[] {
  return [
    { id: VIEWER_ID, name, role: "agent", limit: 6, accepting: true },
    { id: SUPPORT_ADMIN_ID, name: "Rania Osman", role: "admin", limit: 6, accepting: true },
    { id: "noah", name: "Noah Patel", role: "agent", limit: 4, accepting: true },
    { id: "maya", name: "Maya Hassan", role: "agent", limit: 3, accepting: true },
    { id: "leo", name: "Leo Ferreira", role: "agent", limit: 2, accepting: false },
  ];
}

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

export function canSeeConversation(conversation: LiveConversation, isAdmin: boolean, viewerId: string) {
  if (isAdmin) return true;
  if (conversation.status === "waiting") return conversation.queuedForId === viewerId;
  return conversation.ownerId === viewerId;
}

export function assigneeId(conversation: LiveConversation) {
  return conversation.status === "waiting" ? conversation.queuedForId : conversation.ownerId;
}

/** Keep the oldest queued chats inside each accepting member's limit, then fill open slots. */
export function rebalance(conversations: LiveConversation[], members: SupportMember[]): LiveConversation[] {
  const waiting = conversations
    .filter((conversation) => conversation.status === "waiting")
    .sort((left, right) => new Date(left.handedOffAt).getTime() - new Date(right.handedOffAt).getTime());
  const rest = conversations.filter((conversation) => conversation.status !== "waiting");
  const counts = new Map(members.map((member) => [member.id, 0]));

  const hasRoom = (id: string) => {
    const member = members.find((entry) => entry.id === id);
    if (!member?.accepting) return false;
    return (counts.get(id) ?? 0) < member.limit;
  };

  const kept: LiveConversation[] = [];
  const loose: LiveConversation[] = [];

  for (const conversation of waiting) {
    if (conversation.queuedForId && hasRoom(conversation.queuedForId)) {
      counts.set(conversation.queuedForId, (counts.get(conversation.queuedForId) ?? 0) + 1);
      kept.push(conversation);
    } else {
      loose.push(conversation);
    }
  }

  for (const conversation of loose) {
    const next = members
      .filter((member) => member.accepting && (counts.get(member.id) ?? 0) < member.limit)
      .sort(
        (left, right) =>
          (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0) || left.name.localeCompare(right.name),
      )[0];
    if (!next) {
      kept.push({ ...conversation, queuedForId: null });
      continue;
    }
    counts.set(next.id, (counts.get(next.id) ?? 0) + 1);
    kept.push({ ...conversation, queuedForId: next.id });
  }

  return [...rest, ...kept];
}
