import { describe, expect, it } from "vitest";
import type { LiveChatMessage } from "@rdx/chat-contract";
import { compareMessageIds, INITIAL_LIVE_CHAT_STATE, liveChatReducer, type LiveChatAction } from "./state";

const message = (id: string, fields: Partial<LiveChatMessage> = {}): LiveChatMessage => ({
  id,
  author: "agent",
  authorName: "Sarah",
  body: `message ${id}`,
  at: "2026-11-04T10:00:00.000Z",
  clientId: null,
  ...fields,
});

const run = (...actions: LiveChatAction[]) => actions.reduce(liveChatReducer, INITIAL_LIVE_CHAT_STATE);

describe("liveChatReducer", () => {
  it("keeps messages ordered by id and drops duplicates", () => {
    const state = run(
      { type: "message", message: message("10") },
      { type: "message", message: message("9") },
      { type: "message", message: message("11") },
      { type: "message", message: message("10") },
    );
    expect(state.messages.map((item) => item.id)).toEqual(["9", "10", "11"]);
  });

  it("replaces the pending bubble when the server copy arrives", () => {
    const pending = run({ type: "pending", clientId: "live_abc12345", body: "hi", at: 1 });
    expect(pending.pending).toHaveLength(1);

    const delivered = liveChatReducer(pending, {
      type: "message",
      message: message("5", { author: "customer", clientId: "live_abc12345" }),
    });
    expect(delivered.pending).toHaveLength(0);
    expect(delivered.messages).toHaveLength(1);
  });

  it("marks a failed send and clears the flag on retry", () => {
    const failed = run(
      { type: "pending", clientId: "c1-abcdef", body: "hi", at: 1 },
      { type: "pending_failed", clientId: "c1-abcdef" },
    );
    expect(failed.pending[0].failed).toBe(true);
    expect(liveChatReducer(failed, { type: "pending_retry", clientId: "c1-abcdef" }).pending[0].failed).toBe(false);
  });
});

describe("compareMessageIds", () => {
  it("compares numerically", () => {
    expect(compareMessageIds("9", "10")).toBeLessThan(0);
    expect(compareMessageIds("100", "99")).toBeGreaterThan(0);
    expect(compareMessageIds("42", "42")).toBe(0);
  });
});
