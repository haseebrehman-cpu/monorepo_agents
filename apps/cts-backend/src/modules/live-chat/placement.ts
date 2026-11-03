export type PlacementMember = {
  id: number;
  name: string;
  limit: number;
  /** Waiting chats queued to this member plus active chats they own. */
  load: number;
};

export type WaitingChat = {
  id: string;
  queuedForId: number | null;
};

export type QueueMember = {
  id: number;
  name: string;
  limit: number;
  /** Active chats this member owns. */
  owned: number;
};

/**
 * Assigns unassigned waiting chats, oldest first, to the accepting member with the
 * lowest load who is still under their limit. Ties break by name, then id.
 * Chats that do not fit are left out of the result and stay in User Queue.
 */
export function placeChats(chatIds: string[], members: PlacementMember[]): Map<string, number> {
  const loads = new Map(members.map((member) => [member.id, member.load]));
  const placements = new Map<string, number>();

  for (const chatId of chatIds) {
    let next: PlacementMember | undefined;
    for (const member of members) {
      const load = loads.get(member.id)!;
      if (load >= member.limit) continue;
      if (!next) {
        next = member;
        continue;
      }
      const nextLoad = loads.get(next.id)!;
      if (
        load < nextLoad ||
        (load === nextLoad &&
          (member.name.localeCompare(next.name) < 0 ||
            (member.name === next.name && member.id < next.id)))
      ) {
        next = member;
      }
    }
    if (!next) break;
    loads.set(next.id, loads.get(next.id)! + 1);
    placements.set(chatId, next.id);
  }

  return placements;
}

/**
 * Recomputes queue placement for every waiting chat, oldest first.
 * `members` must contain only members who are accepting chats.
 * A chat keeps its member while that member is accepting and under their limit.
 * Everything else is placed again with `placeChats`, or released to User Queue.
 * Returns only the chats whose `queuedForId` changes.
 */
export function rebalanceQueue(
  waiting: WaitingChat[],
  members: QueueMember[]
): Map<string, number | null> {
  const byId = new Map(members.map((member) => [member.id, member]));
  const loads = new Map(members.map((member) => [member.id, member.owned]));
  const loose: WaitingChat[] = [];

  for (const chat of waiting) {
    const member = chat.queuedForId === null ? undefined : byId.get(chat.queuedForId);
    if (member && loads.get(member.id)! < member.limit) {
      loads.set(member.id, loads.get(member.id)! + 1);
    } else {
      loose.push(chat);
    }
  }

  const placements = placeChats(
    loose.map((chat) => chat.id),
    members.map((member) => ({
      id: member.id,
      name: member.name,
      limit: member.limit,
      load: loads.get(member.id)!,
    }))
  );

  const changes = new Map<string, number | null>();
  for (const chat of loose) {
    const next = placements.get(chat.id) ?? null;
    if (next !== chat.queuedForId) changes.set(chat.id, next);
  }
  return changes;
}
