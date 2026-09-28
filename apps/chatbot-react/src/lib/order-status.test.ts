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

  it("shows the courier timeline and delivery details from a live tracking response", () => {
    const view = buildOrderStatusView({
      order_number: "RDX-UK#413562",
      status: "PAID",
      financial_status: "PAID",
      fulfillment_status: "FULFILLED",
      placed_at: "2026-09-24",
      items: [{ title: "RDX S4 Weightlifting Wrist Straps", quantity: 1 }],
      cancelled: false,
      cancelled_at: null,
      overall_state: "delivered",
      overall_label: "Delivered",
      shipments: [
        {
          carrier: "Huxloe 360",
          tracking_number: "JJD0002231705171021",
          tracking_url: null,
          status: "FULFILLED",
          estimated_delivery: null,
          position: 1,
          of: 1,
          reference: "RDX-UK#413562-F1",
          state: "delivered",
          state_label: "Delivered",
          store_state: "shipped",
          courier_state: "delivered",
          conflict: false,
          items: [{ title: "RDX S4 Weightlifting Wrist Straps", quantity: 1 }],
          tracking: [
            {
              carrier: "Huxloe 360",
              number: "JJD0002231705171021",
              url: null,
              link_status: "missing",
              state: "delivered",
              handled_by: "InPost UK",
              service: null,
              signed_for: false,
              other_numbers: [],
            },
          ],
          link_status: "missing",
          shipped_at: "2026-09-24",
          in_transit_at: "2026-09-24",
          out_for_delivery_at: "2026-09-25",
          delivered_at: "2026-09-25",
          delivered_at_local: "2026-09-25T14:23",
          last_update_at: "2026-09-25T14:23:27+00:00",
          events: [
            {
              state: "delivered",
              label: "Delivered",
              text: "Parcel Delivered to Customer",
              location: null,
              at: "2026-09-25T14:23:27+00:00",
              local: "2026-09-25T14:23",
              has_time: true,
            },
            {
              state: "out_for_delivery",
              label: "Out for delivery",
              text: "Out for Delivery",
              at: "2026-09-25T09:04:16+00:00",
              local: "2026-09-25T09:04",
              has_time: true,
            },
            {
              state: "in_transit",
              label: "In transit",
              text: "Scan In - Hub",
              at: "2026-09-25T05:40:35+00:00",
              local: "2026-09-25T05:40",
              has_time: true,
            },
          ],
        },
      ],
      unshipped_items: [],
      cancelled_shipments: 0,
      tracking_available: true,
      needs_attention: false,
      as_of: "2026-09-28T08:28:29.629325+00:00",
    });

    expect(view).toMatchObject({
      orderNumber: "RDX-UK#413562",
      headline: "Delivered",
      summary: "All items in this order have shipped.",
      payment: "Paid",
      fulfillment: "Fulfilled",
      placed: "24 Sept 2026",
      checkedAt: "28 Sept 2026, 08:28",
      cancelledShipmentsNote: null,
      shipments: [
        {
          heading: "Delivered",
          carrier: "Huxloe 360",
          handledBy: "InPost UK",
          service: null,
          reference: "RDX-UK#413562-F1",
          trackingNumbers: ["JJD0002231705171021"],
          trackingUrl: null,
          trackingLinkNote: "A courier tracking link is not available.",
          signedFor: false,
          detail: "Delivered on 25 Sept 2026 at 14:23.",
          events: [
            {
              label: "Delivered",
              text: "Parcel Delivered to Customer",
              location: null,
              when: "25 Sept 2026, 14:23",
            },
            {
              label: "Out for delivery",
              text: null,
              when: "25 Sept 2026, 09:04",
            },
            {
              label: "In transit",
              text: "Scan In - Hub",
              when: "25 Sept 2026, 05:40",
            },
          ],
        },
      ],
    });
  });

  it("keeps milestone dates when the courier sends no event history", () => {
    const view = buildOrderStatusView({
      order_number: "2001",
      overall_label: "In transit",
      shipments: [
        {
          carrier: "DPD",
          state_label: "In transit",
          shipped_at: "2026-09-20",
          in_transit_at: "2026-09-21",
          out_for_delivery_at: "2026-09-22",
          failed_attempt_at: "2026-09-22",
          estimated_delivery: "2026-09-23",
          estimate_passed: true,
          conflict: true,
          store_state: "shipped",
          courier_state: "failed_attempt",
          tracking: [{ number: "DPD1", signed_for: true, other_numbers: ["ALT9"] }],
        },
      ],
      unshipped_items: [],
    });

    expect(view.shipments[0]).toMatchObject({
      signedFor: true,
      otherNumbers: ["ALT9"],
      detail:
        "Shipped on 20 Sept 2026. In transit since 21 Sept 2026. Out for delivery on 22 Sept 2026. A delivery attempt failed on 22 Sept 2026. The estimated delivery date of 23 Sept 2026 has passed. The store shows Shipped, while the courier shows Failed Attempt.",
    });
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
