import { describe, expect, it } from "vitest";
import type { VerifiedOrder } from "@rdx/chat-contract";
import { buildOrderStatusView } from "./order-status";

const partialOrder: VerifiedOrder = {
  order_number: "410232",
  status: "PAID",
  financial_status: "PAID",
  fulfillment_status: "PARTIALLY_FULFILLED",
  placed_at: "2026-08-29",
  items: [
    {
      title:
        "RDX IS Gel Padded Inner Gloves Hook & Loop Wrist Strap for Knuckle Protection OEKO-TEX® Standard 100 certified",
      quantity: 1,
    },
    { title: "RDX F6 Kara Boxing Training Gloves Black", quantity: 1 },
  ],
  cancelled: false,
  overall_state: "partially_shipped",
  overall_label: "Partly shipped",
  shipments: [
    {
      carrier: "Huxloe 360",
      tracking_number: "JJD0002231705167185",
      tracking_url: null,
      status: "FULFILLED",
      state: "shipped",
      state_label: "Shipped",
      items: [{ title: "RDX F6 Kara Boxing Training Gloves Black", quantity: 1 }],
      tracking: [
        {
          carrier: "Huxloe 360",
          number: "JJD0002231705167185",
          url: null,
          link_status: "missing",
        },
      ],
      shipped_at: "2026-08-31",
      last_update_at: "2026-08-31T07:49:58+00:00",
      stale: true,
      attention: "no_recent_update",
    },
  ],
  unshipped_items: [
    {
      title:
        "RDX IS Gel Padded Inner Gloves Hook & Loop Wrist Strap for Knuckle Protection OEKO-TEX® Standard 100 certified",
      quantity: 1,
    },
  ],
};

describe("buildOrderStatusView", () => {
  it("separates the shipped product from the one still waiting", () => {
    expect(buildOrderStatusView(partialOrder)).toMatchObject({
      orderNumber: "410232",
      headline: "Partly shipped",
      summary: "1 item has shipped. 1 item has not shipped yet.",
      payment: "Paid",
      placed: "29 Aug 2026",
      shipments: [
        {
          heading: "Shipped",
          carrier: "Huxloe 360",
          items: [{ title: "RDX F6 Kara Boxing Training Gloves Black", quantity: 1 }],
          trackingNumbers: ["JJD0002231705167185"],
          trackingUrl: null,
          detail:
            "Shipped on 31 Aug 2026. There has been no tracking update since then.",
        },
      ],
      unshipped: [
        {
          title:
            "RDX IS Gel Padded Inner Gloves Hook & Loop Wrist Strap for Knuckle Protection OEKO-TEX® Standard 100 certified",
          quantity: 1,
        },
      ],
      unshippedNote: "This item has not been dispatched.",
      otherItems: [],
    });
  });

  it("says every item shipped when nothing is left waiting", () => {
    const view = buildOrderStatusView({
      order_number: "1001",
      overall_label: "Shipped",
      financial_status: "PAID",
      shipments: [
        {
          carrier: "DPD",
          state_label: "Shipped",
          tracking_url: "https://track.example/1001",
          items: [{ title: "Gloves", quantity: 2 }],
        },
      ],
      unshipped_items: [],
    });

    expect(view.summary).toBe("All items in this order have shipped.");
    expect(view.unshipped).toEqual([]);
    expect(view.shipments[0]?.trackingUrl).toBe("https://track.example/1001");
    expect(view.shipments[0]?.items).toEqual([{ title: "Gloves", quantity: 2 }]);
  });

  it("says nothing has shipped when the order is still being prepared", () => {
    const view = buildOrderStatusView({
      order_number: "1002",
      unshipped_items: [{ title: "Wraps", quantity: 1 }],
      shipments: [],
    });

    expect(view.headline).toBe("Not shipped yet");
    expect(view.summary).toBe("None of the items in this order have shipped yet.");
    expect(view.unshippedNote).toBeNull();
  });

  it("keeps a plain item list when the response has no shipment split", () => {
    const view = buildOrderStatusView({
      order_number: "1003",
      status: "PAID",
      items: [{ title: "Headguard", quantity: 1 }],
    });

    expect(view.headline).toBe("Paid");
    expect(view.summary).toBeNull();
    expect(view.otherItems).toEqual([{ title: "Headguard", quantity: 1 }]);
  });
});
