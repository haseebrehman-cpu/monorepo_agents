import { describe, expect, it } from "vitest";
import { placeChats, rebalanceQueue, type PlacementMember, type QueueMember } from "./placement.js";

function member(id: number, name: string, limit: number, load = 0): PlacementMember {
  return { id, name, limit, load };
}

describe("placeChats", () => {
  it("gives the oldest chat to the member with the lowest load", () => {
    const placements = placeChats(["c1"], [member(1, "Noah", 6, 3), member(2, "Maya", 6, 1)]);

    expect(placements.get("c1")).toBe(2);
  });

  it("breaks load ties by name, then id", () => {
    expect(placeChats(["c1"], [member(1, "Noah", 6), member(2, "Maya", 6)]).get("c1")).toBe(2);
    expect(placeChats(["c1"], [member(9, "Sam", 6), member(4, "Sam", 6)]).get("c1")).toBe(4);
  });

  it("spreads several chats incrementally across members", () => {
    const placements = placeChats(
      ["c1", "c2", "c3"],
      [member(1, "Aisha", 6), member(2, "Bilal", 6)]
    );

    expect([...placements.entries()]).toEqual([
      ["c1", 1],
      ["c2", 2],
      ["c3", 1],
    ]);
  });

  it("never exceeds a member's limit and leaves the rest unassigned", () => {
    const placements = placeChats(["c1", "c2", "c3"], [member(1, "Aisha", 2, 1)]);

    expect([...placements.entries()]).toEqual([["c1", 1]]);
  });

  it("places nothing when there are no members with room", () => {
    expect(placeChats(["c1"], []).size).toBe(0);
    expect(placeChats(["c1"], [member(1, "Aisha", 6, 6)]).size).toBe(0);
  });
});

function queueMember(id: number, name: string, limit: number, owned = 0): QueueMember {
  return { id, name, limit, owned };
}

describe("rebalanceQueue", () => {
  it("keeps a chat with its member while they have room and reports no change", () => {
    const changes = rebalanceQueue([{ id: "c1", queuedForId: 1 }], [queueMember(1, "Aisha", 2)]);

    expect(changes.size).toBe(0);
  });

  it("counts owned chats against the limit", () => {
    const changes = rebalanceQueue(
      [{ id: "c1", queuedForId: null }],
      [queueMember(1, "Aisha", 2, 2), queueMember(2, "Bilal", 2, 1)]
    );

    expect([...changes.entries()]).toEqual([["c1", 2]]);
  });

  it("releases chats from a member who went offline and places them elsewhere", () => {
    const changes = rebalanceQueue(
      [
        { id: "c1", queuedForId: 9 },
        { id: "c2", queuedForId: 9 },
      ],
      [queueMember(1, "Aisha", 1)]
    );

    expect([...changes.entries()]).toEqual([
      ["c1", 1],
      ["c2", null],
    ]);
  });

  it("sheds the newest queued chats when a limit drops, keeping the oldest", () => {
    const changes = rebalanceQueue(
      [
        { id: "old", queuedForId: 1 },
        { id: "mid", queuedForId: 1 },
        { id: "new", queuedForId: 1 },
      ],
      [queueMember(1, "Aisha", 2, 1)]
    );

    expect([...changes.entries()]).toEqual([
      ["mid", null],
      ["new", null],
    ]);
  });

  it("fills a freed slot with the oldest unassigned chat", () => {
    const changes = rebalanceQueue(
      [
        { id: "oldest", queuedForId: null },
        { id: "newer", queuedForId: null },
      ],
      [queueMember(1, "Aisha", 3, 2)]
    );

    expect([...changes.entries()]).toEqual([["oldest", 1]]);
  });
});
