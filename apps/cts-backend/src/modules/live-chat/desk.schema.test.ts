import { describe, expect, it } from "vitest";
import {
  conversationParamsSchema,
  sendMessageSchema,
  updatePresenceSchema,
} from "./desk.schema.js";
import { eventForUser } from "./live-chat.events.js";

describe("sendMessageSchema", () => {
  it("normalises the body", () => {
    expect(sendMessageSchema.parse({ kind: "reply", body: "  Hi\r\nthere\u0007 " })).toEqual({
      kind: "reply",
      body: "Hi\nthere",
    });
  });

  it.each([
    ["an empty body", { kind: "reply", body: "   " }],
    ["an unsent canned shortcut", { kind: "reply", body: "/refund" }],
    ["an oversized body", { kind: "note", body: "x".repeat(4_001) }],
    ["an unknown kind", { kind: "system", body: "Hi" }],
  ])("rejects %s", (_label, input) => {
    expect(sendMessageSchema.safeParse(input).success).toBe(false);
  });
});

describe("updatePresenceSchema", () => {
  it("accepts a limit or an online change", () => {
    expect(updatePresenceSchema.parse({ limit: 6 })).toEqual({ limit: 6 });
    expect(updatePresenceSchema.parse({ accepting: false })).toEqual({ accepting: false });
  });

  it.each([{}, { limit: 0 }, { limit: 13 }, { limit: 2.5 }, { accepting: "yes" }])(
    "rejects %j",
    (input) => {
      expect(updatePresenceSchema.safeParse(input).success).toBe(false);
    }
  );
});

describe("conversationParamsSchema", () => {
  it("only accepts UUIDs", () => {
    expect(
      conversationParamsSchema.safeParse({ conversationId: "07946fbf-6790-450d-9a94-d2e23453be68" })
        .success
    ).toBe(true);
    expect(conversationParamsSchema.safeParse({ conversationId: "1 OR 1=1" }).success).toBe(false);
  });
});

describe("eventForUser", () => {
  it("only tells each member about chats assigned to them", () => {
    const event = {
      ids: ["a", "b"],
      assigned: [
        ["a", 1],
        ["b", 2],
      ] as [string, number][],
      queued: [],
      members: true,
    };

    expect(eventForUser(event, 1)).toEqual({
      ids: ["a", "b"],
      assignedToYou: ["a"],
      queued: [],
      members: true,
    });
    expect(eventForUser(event, 3).assignedToYou).toEqual([]);
  });
});
