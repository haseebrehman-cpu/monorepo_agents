/** Main panel plus side windows. One slot is the main conversation. */
export const MAX_OPEN_CHATS = 5;

export const FLOAT_PILL_WIDTH = 240;
export const FLOAT_WINDOW_WIDTH = 352;
export const FLOAT_GAP = 12;
export const CUSTOMER_PANEL_WIDTH = 320;

export type OpenChatSession = {
  /** Open order, oldest first. Includes the main conversation. */
  openIds: string[];
  mainId: string | null;
  /** Side windows the agent collapsed. Overflow collapse is not stored here. */
  collapsedIds: string[];
};

export type OpenChatStatus = "focused" | "floated" | "limit";

export function createOpenChatSession(mainId: string | null = null): OpenChatSession {
  return {
    openIds: mainId ? [mainId] : [],
    mainId,
    collapsedIds: [],
  };
}

export function openChat(
  session: OpenChatSession,
  id: string,
  options: { promote: boolean },
): { session: OpenChatSession; status: OpenChatStatus } {
  if (session.openIds.includes(id)) {
    if (!options.promote || session.mainId === id) {
      return { session, status: "focused" };
    }
    return { session: promoteToMain(session, id), status: "focused" };
  }

  if (session.openIds.length >= MAX_OPEN_CHATS) {
    return { session, status: "limit" };
  }

  const withId: OpenChatSession = {
    ...session,
    openIds: [...session.openIds, id],
    collapsedIds: session.collapsedIds.filter((chatId) => chatId !== id),
  };

  if (options.promote || session.mainId === null) {
    return { session: promoteToMain(withId, id), status: "focused" };
  }

  return { session: withId, status: "floated" };
}

/** Open a chat in the main panel. Only chats that pass canFloat stay as side windows. */
export function openChatInMain(
  session: OpenChatSession,
  id: string,
  canFloat: (id: string) => boolean,
): OpenChatSession {
  const previous = session.mainId;
  const floats = session.openIds.filter((chatId) => chatId !== id && chatId !== previous && canFloat(chatId));
  const keptPrevious = previous && previous !== id && canFloat(previous) ? [previous] : [];
  let openIds = [...floats, ...keptPrevious];
  while (openIds.length >= MAX_OPEN_CHATS) openIds.shift();
  openIds = [...openIds, id];
  return {
    openIds,
    mainId: id,
    collapsedIds: session.collapsedIds.filter((chatId) => openIds.includes(chatId) && chatId !== id),
  };
}

/** Drop side windows that are no longer allowed to float. The main panel stays. */
export function retainFloats(session: OpenChatSession, canFloat: (id: string) => boolean): OpenChatSession {
  const mainId = session.mainId;
  const floats = session.openIds.filter((id) => id !== mainId && canFloat(id));
  const openIds = mainId && session.openIds.includes(mainId) ? [...floats, mainId] : floats;
  const same =
    openIds.length === session.openIds.length && openIds.every((id, index) => id === session.openIds[index]);
  if (same) return session;
  const nextMain = mainId && openIds.includes(mainId) ? mainId : (openIds.at(-1) ?? null);
  return {
    openIds,
    mainId: nextMain,
    collapsedIds: session.collapsedIds.filter((id) => openIds.includes(id) && id !== nextMain),
  };
}

export function closeOpenChat(session: OpenChatSession, id: string): OpenChatSession {
  if (!session.openIds.includes(id)) return session;
  const openIds = session.openIds.filter((chatId) => chatId !== id);
  const collapsedIds = session.collapsedIds.filter((chatId) => chatId !== id);
  const mainId = session.mainId === id ? (openIds.at(-1) ?? null) : session.mainId;
  return { openIds, collapsedIds, mainId };
}

export function pruneOpenChats(
  session: OpenChatSession,
  canKeep: (id: string) => boolean,
): OpenChatSession {
  const openIds = session.openIds.filter(canKeep);
  if (openIds.length === session.openIds.length) return session;
  const collapsedIds = session.collapsedIds.filter((id) => openIds.includes(id));
  const mainId =
    session.mainId && openIds.includes(session.mainId) ? session.mainId : (openIds.at(-1) ?? null);
  return { openIds, collapsedIds, mainId };
}

export function collapseFloat(session: OpenChatSession, id: string): OpenChatSession {
  if (!session.openIds.includes(id) || session.mainId === id || session.collapsedIds.includes(id)) {
    return session;
  }
  return { ...session, collapsedIds: [...session.collapsedIds, id] };
}

/** Side windows in open order, excluding the main panel. */
export function floatingIds(session: OpenChatSession): string[] {
  return session.openIds.filter((id) => id !== session.mainId);
}

export type FloatLayoutItem = {
  id: string;
  minimized: boolean;
};

/**
 * Fits side windows into the content width.
 * Newest windows the agent left open take the expanded slots.
 * Narrow layouts keep every side window as a pill.
 */
export function layoutFloats(
  ids: string[],
  collapsedIds: ReadonlySet<string>,
  availableWidth: number,
  narrow: boolean,
): FloatLayoutItem[] {
  if (ids.length === 0) return [];
  if (narrow || availableWidth <= 0) {
    return ids.map((id) => ({ id, minimized: true }));
  }

  const gaps = (ids.length - 1) * FLOAT_GAP;
  let used = ids.length * FLOAT_PILL_WIDTH + gaps;
  const expanded = new Set<string>();
  const preferred = [...ids].reverse().filter((id) => !collapsedIds.has(id));

  for (const id of preferred) {
    const next = used + (FLOAT_WINDOW_WIDTH - FLOAT_PILL_WIDTH);
    if (next > availableWidth) break;
    expanded.add(id);
    used = next;
  }

  return ids.map((id) => ({ id, minimized: !expanded.has(id) }));
}

/**
 * Expands one side window. If the row is full, older expanded windows
 * collapse until this one fits.
 */
export function expandFloat(
  session: OpenChatSession,
  id: string,
  availableWidth: number,
  narrow: boolean,
): OpenChatSession {
  if (narrow || session.mainId === id || !session.openIds.includes(id)) return session;

  let collapsedIds = session.collapsedIds.filter((chatId) => chatId !== id);
  const ids = floatingIds({ ...session, collapsedIds });

  for (let guard = ids.length; guard >= 0; guard -= 1) {
    const layout = layoutFloats(ids, new Set(collapsedIds), availableWidth, false);
    const mine = layout.find((item) => item.id === id);
    if (!mine?.minimized) break;
    const oldestExpanded = layout.find((item) => !item.minimized && item.id !== id);
    if (!oldestExpanded) break;
    collapsedIds = [...collapsedIds, oldestExpanded.id];
  }

  return { ...session, collapsedIds };
}

function promoteToMain(session: OpenChatSession, id: string): OpenChatSession {
  const previous = session.mainId;
  const rest = session.openIds.filter((chatId) => chatId !== id && chatId !== previous);
  const openIds = previous && previous !== id ? [...rest, previous, id] : [...session.openIds.filter((chatId) => chatId !== id), id];
  return {
    openIds,
    mainId: id,
    collapsedIds: session.collapsedIds.filter((chatId) => chatId !== id),
  };
}
