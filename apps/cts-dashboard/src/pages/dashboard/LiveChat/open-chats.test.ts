import assert from "node:assert/strict";
import test from "node:test";
import {
  FLOAT_GAP,
  FLOAT_PILL_WIDTH,
  FLOAT_WINDOW_WIDTH,
  MAX_OPEN_CHATS,
  closeOpenChat,
  collapseFloat,
  createOpenChatSession,
  expandFloat,
  floatingIds,
  layoutFloats,
  openChat,
  openChatInMain,
  pruneOpenChats,
  retainFloats,
} from "./open-chats.ts";

test("the first chat becomes the main panel", () => {
  const opened = openChat(createOpenChatSession(), "a", { promote: false });
  assert.equal(opened.status, "focused");
  assert.deepEqual(opened.session, {
    openIds: ["a"],
    mainId: "a",
    collapsedIds: [],
  });
});

test("another chat floats without replacing the main panel", () => {
  const first = openChat(createOpenChatSession(), "a", { promote: true }).session;
  const second = openChat(first, "b", { promote: false });
  assert.equal(second.status, "floated");
  assert.equal(second.session.mainId, "a");
  assert.deepEqual(floatingIds(second.session), ["b"]);
});

test("opening a side window again parks the previous main as the newest float", () => {
  const session = ["a", "b", "c"].reduce(
    (current, id, index) => openChat(current, id, { promote: index === 0 }).session,
    createOpenChatSession(),
  );
  const focused = openChat(session, "b", { promote: true });
  assert.equal(focused.status, "focused");
  assert.equal(focused.session.mainId, "b");
  assert.deepEqual(floatingIds(focused.session), ["c", "a"]);
});

test("the open cap rejects another chat and keeps the session", () => {
  let session = createOpenChatSession();
  for (let index = 0; index < MAX_OPEN_CHATS; index += 1) {
    session = openChat(session, `c${index}`, { promote: index === 0 }).session;
  }
  const blocked = openChat(session, "extra", { promote: false });
  assert.equal(blocked.status, "limit");
  assert.equal(blocked.session, session);
});

test("closing a side window keeps the main chat", () => {
  const session = openChat(
    openChat(createOpenChatSession(), "a", { promote: true }).session,
    "b",
    { promote: false },
  ).session;
  const next = closeOpenChat(session, "b");
  assert.equal(next.mainId, "a");
  assert.deepEqual(next.openIds, ["a"]);
});

test("closing the main chat promotes the newest remaining chat", () => {
  let session = createOpenChatSession();
  session = openChat(session, "a", { promote: true }).session;
  session = openChat(session, "b", { promote: false }).session;
  session = openChat(session, "c", { promote: false }).session;
  const next = closeOpenChat(session, "a");
  assert.equal(next.mainId, "c");
  assert.deepEqual(floatingIds(next), ["b"]);
});

test("closing the last chat clears the desk", () => {
  const session = openChat(createOpenChatSession(), "a", { promote: true }).session;
  assert.deepEqual(closeOpenChat(session, "a"), {
    openIds: [],
    mainId: null,
    collapsedIds: [],
  });
});

test("prune drops chats the agent can no longer see and repairs the main slot", () => {
  let session = createOpenChatSession();
  session = openChat(session, "a", { promote: true }).session;
  session = openChat(session, "b", { promote: false }).session;
  const same = pruneOpenChats(session, () => true);
  assert.equal(same, session);
  const pruned = pruneOpenChats(session, (id) => id !== "a");
  assert.equal(pruned.mainId, "b");
  assert.deepEqual(pruned.openIds, ["b"]);
});

test("layout keeps narrow desks as pills and expands the newest windows that fit", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(
    layoutFloats(ids, new Set(), 1200, true),
    ids.map((id) => ({ id, minimized: true })),
  );

  const oneSlot = FLOAT_PILL_WIDTH * 3 + FLOAT_GAP * 2 + (FLOAT_WINDOW_WIDTH - FLOAT_PILL_WIDTH);
  const layout = layoutFloats(ids, new Set(["b"]), oneSlot, false);
  assert.deepEqual(layout, [
    { id: "a", minimized: true },
    { id: "b", minimized: true },
    { id: "c", minimized: false },
  ]);
});

test("expanding a window collapses older expanded windows until it fits", () => {
  let session = createOpenChatSession("main");
  session = openChat(session, "a", { promote: false }).session;
  session = openChat(session, "b", { promote: false }).session;
  session = openChat(session, "c", { promote: false }).session;

  const oneWindow = FLOAT_PILL_WIDTH * 3 + FLOAT_GAP * 2 + (FLOAT_WINDOW_WIDTH - FLOAT_PILL_WIDTH);
  const collapsed = collapseFloat(session, "c");
  const expanded = expandFloat(collapsed, "a", oneWindow, false);
  assert.equal(expanded.collapsedIds.includes("a"), false);
  const layout = layoutFloats(floatingIds(expanded), new Set(expanded.collapsedIds), oneWindow, false);
  assert.equal(layout.find((item) => item.id === "a")?.minimized, false);
  assert.equal(layout.filter((item) => !item.minimized).length, 1);
});

test("a chat outside Active opens in the main panel and does not stay as a side window", () => {
  const session = openChat(openChat(createOpenChatSession(), "active-a", { promote: true }).session, "active-b", {
    promote: false,
  }).session;
  const active = new Set(["active-a", "active-b"]);
  const next = openChatInMain(session, "queue-c", (id) => active.has(id));
  assert.equal(next.mainId, "queue-c");
  assert.deepEqual(floatingIds(next), ["active-b", "active-a"]);
  assert.equal(retainFloats(next, (id) => active.has(id)), next);
});

test("side windows drop when a chat leaves Active", () => {
  const session = openChat(openChat(createOpenChatSession(), "active-a", { promote: true }).session, "active-b", {
    promote: false,
  }).session;
  const next = retainFloats(session, (id) => id === "active-a");
  assert.equal(next.mainId, "active-a");
  assert.deepEqual(floatingIds(next), []);
});
