import { describe, expect, it } from "vitest";
import type { CartActionResponse } from "@rdx/chat-contract";
import { noticeFromCartAction } from "./cart-outcome";

function action(
  overrides: Partial<CartActionResponse>,
): CartActionResponse {
  return {
    action_id: "cact_01M258GXFZSCT8MNPP0YNG2856",
    op: "add_line",
    outcome: "succeeded",
    ...overrides,
  };
}

describe("noticeFromCartAction", () => {
  it("does not claim an order was placed after checkout", () => {
    const notice = noticeFromCartAction(
      action({
        op: "checkout",
        checkout_status: "requires_escalation",
      }),
      "checkout",
    );
    expect(notice.text.toLowerCase()).not.toContain("order placed");
    expect(notice.text.toLowerCase()).toContain("no order");
  });

  it("does not treat an adjusted quantity as added as requested", () => {
    const notice = noticeFromCartAction(
      action({ outcome: "adjusted", resulting_quantity: 2 }),
      "add",
    );
    expect(notice.text).toContain("2");
    expect(notice.text.toLowerCase()).not.toContain("added as requested");
    expect(notice.kind).toBe("warning");
  });

  it("surfaces the failed reason and does not invite a retry", () => {
    const notice = noticeFromCartAction(
      action({ outcome: "failed", reason: "Sold out at the store." }),
      "add",
    );
    expect(notice.kind).toBe("error");
    expect(notice.text).toBe("Sold out at the store.");
  });
});
