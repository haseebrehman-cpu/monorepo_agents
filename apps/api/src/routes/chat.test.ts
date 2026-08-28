import { describe, expect, it } from "vitest";
import { handleChatRequest } from "./chat.js";

describe("handleChatRequest", () => {
  it("requires a user message", async () => {
    const result = await handleChatRequest({}, "RDX Store");
    expect(result).toEqual({ error: "Message is required." });
  });

  it("returns a demo reply for a valid message", async () => {
    const result = await handleChatRequest(
      { message: "Do you have size M?" },
      "RDX Store",
    );
    expect("reply" in result).toBe(true);
    if ("reply" in result) {
      expect(result.reply).toMatch(/RDX Store/);
      expect(result.reply).toMatch(/size M/);
    }
  });
});
