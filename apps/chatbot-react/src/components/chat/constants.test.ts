import { describe, expect, it } from "vitest";
import { OPTIONS, POPULAR_QUESTIONS } from "./constants";

describe("welcome menu", () => {
  it("lists the welcome menu and includes talk to a human", () => {
    expect(OPTIONS.map((option) => option.id)).toEqual([
      "product-info",
      "track-order",
      "refund-return",
      "damaged-product",
      "talk-human",
    ]);
    expect(OPTIONS.find((option) => option.id === "track-order")?.message).toBe(
      "Track Your Order",
    );
    expect(OPTIONS.find((option) => option.id === "talk-human")?.message).toBe(
      "Talk to a human",
    );
  });

  it("offers three popular questions for gloves, bags, and weightlifting", () => {
    expect(POPULAR_QUESTIONS.map((question) => question.message)).toEqual([
      "Show me boxing gloves",
      "Show me punch bags",
      "Show me weightlifting gear",
    ]);
  });
});
