import { describe, expect, it } from "vitest";
import { OPTIONS, POPULAR_QUESTIONS } from "./constants";

describe("welcome menu", () => {
  it("keeps the existing menu options and adds talk to a human", () => {
    expect(OPTIONS.map((option) => option.id)).toEqual([
      "track-order",
      "find-products",
      "product-info",
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

  it("offers three popular questions for gloves, pads, and weightlifting", () => {
    expect(POPULAR_QUESTIONS.map((question) => question.message)).toEqual([
      "Show me competition boxing gloves",
      "Show me punch pad sets",
      "Show me weightlifting gear",
    ]);
  });
});
