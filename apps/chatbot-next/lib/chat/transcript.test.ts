import { describe, expect, it } from "vitest";
import type { SupportReply } from "@rdx/chat-contract";
import {
  INITIAL_TRANSCRIPT,
  isHome,
  latestAssistantId,
  pendingInput,
  transcriptReducer,
  type ChatMessage,
} from "./transcript";

const reply = (fields: Partial<SupportReply>): SupportReply => ({
  type: "message",
  text: "Hello",
  ...fields,
});

function run(...actions: Parameters<typeof transcriptReducer>[1][]): ChatMessage[] {
  return actions.reduce(transcriptReducer, INITIAL_TRANSCRIPT);
}

describe("transcriptReducer", () => {
  it("starts on the home screen and leaves it after the first message", () => {
    expect(isHome(INITIAL_TRANSCRIPT)).toBe(true);
    expect(isHome(run({ type: "user", id: "u1", text: "hi", at: 1 }))).toBe(false);
  });

  it("reports the pending input request only while it is the latest reply", () => {
    const paused = run(
      { type: "user", id: "u1", text: "Cancel my order", at: 1 },
      {
        type: "reply",
        id: "a1",
        reply: reply({ type: "input_request", input: { kind: "verify_order" } }),
        at: 2,
      },
    );
    expect(pendingInput(paused)?.kind).toBe("verify_order");

    const answered = transcriptReducer(paused, {
      type: "reply",
      id: "a2",
      reply: reply({ type: "message" }),
      at: 3,
    });
    expect(pendingInput(answered)).toBeNull();
    expect(latestAssistantId(answered)).toBe("a2");
  });

  it("returns to the initial transcript on reset", () => {
    const state = run({ type: "user", id: "u1", text: "hi", at: 1 }, { type: "reset" });
    expect(state).toBe(INITIAL_TRANSCRIPT);
  });
});
