import { describe, expect, it } from "vitest";
import {
  buildHumanHandoffMessage,
  isHumanAgentRequest,
  isHumanHandoffResponse,
  isValidHandoffContact,
} from "./human-agent";

describe("isHumanAgentRequest", () => {
  it.each([
    "talk to a human",
    "I want to talk to a human agent",
    "can I speak to someone",
    "connect me to an agent",
    "please transfer me to support",
    "live agent",
    "human agent",
    "customer service",
    "I need a real person",
    "escalate this to an agent",
  ])("treats %j as a handoff request", (text) => {
    expect(isHumanAgentRequest(text)).toBe(true);
  });

  it.each([
    "boxing gloves",
    "do these gloves support velcro",
    "where is my order",
    "shipping times",
    "",
  ])("leaves %j with the assistant", (text) => {
    expect(isHumanAgentRequest(text)).toBe(false);
  });
});

describe("isHumanHandoffResponse", () => {
  it("recognises an offer to connect a person", () => {
    expect(
      isHumanHandoffResponse(
        "I can connect you with a human agent to look at this.",
      ),
    ).toBe(true);
    expect(
      isHumanHandoffResponse("A person will take over this conversation."),
    ).toBe(true);
  });

  it("ignores ordinary product answers", () => {
    expect(
      isHumanHandoffResponse("Here are three pairs of boxing gloves."),
    ).toBe(false);
  });
});

describe("handoff contact", () => {
  it("requires a name and an email", () => {
    expect(isValidHandoffContact("Ada Lovelace", "ada@example.com")).toBe(
      true,
    );
    expect(isValidHandoffContact("  ", "ada@example.com")).toBe(false);
    expect(isValidHandoffContact("Ada", "not-an-email")).toBe(false);
  });

  it("includes the contact and any earlier context", () => {
    expect(
      buildHumanHandoffMessage(
        "Ada Lovelace",
        "ada@example.com",
        "Order number IG-1.",
      ),
    ).toBe(
      "I need to talk to a human agent. My name is Ada Lovelace. My email is ada@example.com. Order number IG-1.",
    );
  });

  it("does not repeat a short request for a person", () => {
    expect(
      buildHumanHandoffMessage("Ada Lovelace", "ada@example.com", "talk to a human"),
    ).toBe(
      "I need to talk to a human agent. My name is Ada Lovelace. My email is ada@example.com.",
    );
  });
});
