import assert from "node:assert/strict";
import test from "node:test";
import { canSeeConversation, canTakeConversation, lastPreview, matchesInbox, workloadFor } from "./assignment.ts";
import type { LiveConversation } from "./types.ts";

function chat(
  id: string,
  status: LiveConversation["status"],
  options: { ownerId?: string | null; queuedForId?: string | null } = {},
): LiveConversation {
  const at = "2026-09-30T10:00:00.000Z";
  return {
    id,
    customerName: id,
    customerEmail: `${id}@example.com`,
    channel: "Website chat",
    orderNumber: null,
    status,
    queuedForId: options.queuedForId ?? null,
    ownerId: options.ownerId ?? null,
    handoffReason: "Handoff",
    aiSummary: "Summary",
    handedOffAt: at,
    updatedAt: at,
    unread: 0,
    tags: [],
    location: "London",
    typing: false,
    messages: [],
  };
}

test("user queue lists only unassigned waiting chats", () => {
  assert.equal(matchesInbox(chat("loose", "waiting"), "user_queue", "you", false), true);
  assert.equal(matchesInbox(chat("mine", "waiting", { queuedForId: "you" }), "user_queue", "you", false), false);
  assert.equal(matchesInbox(chat("theirs", "waiting", { queuedForId: "noah" }), "user_queue", "you", true), false);
});

test("active holds my queued and owned chats, and counts toward my limit", () => {
  const queued = chat("queued", "waiting", { queuedForId: "you" });
  const owned = chat("owned", "active", { ownerId: "you" });
  const theirs = chat("theirs", "active", { ownerId: "noah" });
  assert.equal(matchesInbox(queued, "active", "you", false), true);
  assert.equal(matchesInbox(owned, "active", "you", false), true);
  assert.equal(matchesInbox(theirs, "active", "you", false), false);
  assert.equal(workloadFor([queued, owned, theirs], "you"), 2);
});

test("team shows admins everyone else's queued and active chats", () => {
  assert.equal(matchesInbox(chat("a", "active", { ownerId: "noah" }), "team", "you", true), true);
  assert.equal(matchesInbox(chat("b", "waiting", { queuedForId: "noah" }), "team", "you", true), true);
  assert.equal(matchesInbox(chat("c", "active", { ownerId: "noah" }), "team", "you", false), false);
});

test("agents cannot see chats queued to or owned by someone else", () => {
  assert.equal(canSeeConversation(chat("a", "waiting", { queuedForId: "noah" }), false, "you"), false);
  assert.equal(canSeeConversation(chat("b", "active", { ownerId: "noah" }), false, "you"), false);
  assert.equal(canSeeConversation(chat("c", "waiting"), false, "you"), true);
  assert.equal(canSeeConversation(chat("d", "active", { ownerId: "noah" }), true, "you"), true);
});

test("agents take their queued chats and admins can also take over", () => {
  const mine = chat("mine", "waiting", { queuedForId: "you" });
  const loose = chat("loose", "waiting");
  const theirs = chat("theirs", "active", { ownerId: "noah" });
  assert.equal(canTakeConversation(mine, "you", false, true), true);
  assert.equal(canTakeConversation(loose, "you", false, true), false);
  assert.equal(canTakeConversation(theirs, "you", false, true), false);
  assert.equal(canTakeConversation(theirs, "you", true, true), true);
  assert.equal(canTakeConversation(mine, "you", false, false), false);
});

test("list previews use the latest non-system message", () => {
  const row = { ...chat("row", "waiting"), lastMessage: { id: "1", author: "note" as const, authorName: "A", body: "check", at: "" } };
  assert.equal(lastPreview(row), "Note: check");
  assert.equal(lastPreview(chat("empty", "waiting")), "Handed off from the AI assistant");
});
