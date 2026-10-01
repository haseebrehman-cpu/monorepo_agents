import assert from "node:assert/strict";
import test from "node:test";
import { matchesInbox, rebalance, workloadFor } from "./assignment.ts";
import type { LiveConversation, SupportMember } from "./types.ts";

function member(id: string, name: string, limit: number, accepting = true): SupportMember {
  return { id, name, role: "agent", limit, accepting };
}

function chat(
  id: string,
  status: LiveConversation["status"],
  options: { ownerId?: string | null; queuedForId?: string | null; handedOffAt?: string; updatedAt?: string } = {},
): LiveConversation {
  const at = options.handedOffAt ?? "2026-09-30T10:00:00.000Z";
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
    updatedAt: options.updatedAt ?? at,
    unread: 0,
    tags: [],
    location: "London",
    currentPage: "/",
    visits: 1,
    browser: "Chrome",
    referrer: "Direct",
    typing: false,
    messages: [],
  };
}

test("active load counts owned chats and assigned waiting chats", () => {
  const members = [member("you", "You", 2), member("noah", "Noah Patel", 2)];
  const placed = rebalance(
    [
      chat("owned", "active", { ownerId: "you", updatedAt: "2026-09-30T12:00:00.000Z" }),
      chat("oldest", "waiting", { handedOffAt: "2026-09-30T09:00:00.000Z" }),
      chat("next", "waiting", { handedOffAt: "2026-09-30T09:30:00.000Z" }),
      chat("later", "waiting", { handedOffAt: "2026-09-30T11:00:00.000Z" }),
    ],
    members,
  );

  const assignedToYou = placed.filter((conversation) => conversation.status === "waiting" && conversation.queuedForId === "you");
  assert.equal(workloadFor(placed, "you"), 2);
  assert.equal(assignedToYou.length, 1);
  assert.equal(matchesInbox(assignedToYou[0], "active", "you", false), true);
  assert.equal(matchesInbox(assignedToYou[0], "user_queue", "you", false), true);
  const waitingForNoah = placed.filter((conversation) => conversation.queuedForId === "noah");
  assert.equal(waitingForNoah.length, 2);
  assert.equal(matchesInbox(waitingForNoah[0], "user_queue", "you", false), true);
  assert.equal(matchesInbox(waitingForNoah[0], "active", "you", false), false);
});

test("closing an owned chat assigns the next oldest waiting chat", () => {
  const members = [member("you", "You", 1)];
  const full = rebalance(
    [
      chat("owned", "active", { ownerId: "you" }),
      chat("oldest", "waiting", { handedOffAt: "2026-09-30T09:00:00.000Z" }),
      chat("next", "waiting", { handedOffAt: "2026-09-30T09:30:00.000Z" }),
    ],
    members,
  );
  assert.equal(full.find((conversation) => conversation.id === "oldest")?.queuedForId, null);

  const afterClose = rebalance(
    full.map((conversation) =>
      conversation.id === "owned" ? { ...conversation, status: "resolved" as const } : conversation,
    ),
    members,
  );
  assert.equal(afterClose.find((conversation) => conversation.id === "oldest")?.queuedForId, "you");
  assert.equal(afterClose.find((conversation) => conversation.id === "next")?.queuedForId, null);
  assert.equal(workloadFor(afterClose, "you"), 1);
});

test("user queue lists every waiting chat and active stays owner-only", () => {
  const waiting = chat("shared", "waiting", { queuedForId: "noah" });
  const owned = chat("mine", "active", { ownerId: "you" });
  const theirs = chat("theirs", "active", { ownerId: "noah" });
  assert.equal(matchesInbox(waiting, "user_queue", "you", false), true);
  assert.equal(matchesInbox(waiting, "active", "you", false), false);
  assert.equal(matchesInbox(owned, "active", "you", false), true);
  assert.equal(matchesInbox(theirs, "active", "you", false), false);
  assert.equal(matchesInbox(theirs, "team", "you", true), true);
});
