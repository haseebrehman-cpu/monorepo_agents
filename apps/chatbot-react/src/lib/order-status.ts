import type { OrderItem, OrderShipment, VerifiedOrder } from "@rdx/chat-contract";

export interface OrderProductLine {
  title: string;
  quantity: number;
}

export interface OrderTrackingEventView {
  label: string;
  text: string | null;
  location: string | null;
  when: string | null;
}

export interface OrderShipmentView {
  heading: string;
  carrier: string | null;
  handledBy: string | null;
  service: string | null;
  reference: string | null;
  items: OrderProductLine[];
  trackingNumbers: string[];
  otherNumbers: string[];
  trackingUrl: string | null;
  trackingLinkNote: string | null;
  signedFor: boolean;
  detail: string | null;
  events: OrderTrackingEventView[];
}

export interface OrderStatusView {
  orderNumber: string;
  headline: string;
  summary: string | null;
  payment: string | null;
  fulfillment: string | null;
  placed: string | null;
  cancelledOn: string | null;
  checkedAt: string | null;
  cancelledShipmentsNote: string | null;
  shipments: OrderShipmentView[];
  unshipped: OrderProductLine[];
  unshippedNote: string | null;
  otherItems: OrderProductLine[];
}

export function formatOrderStatus(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatOrderDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatOrderStamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatOrderDate(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}

/** Formats a courier local timestamp without shifting its clock time. */
function formatWallClock(value?: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = match[4];
  const minute = match[5];
  const date = new Date(
    Date.UTC(year, month - 1, day, hour ? Number(hour) : 0, minute ? Number(minute) : 0),
  );
  if (Number.isNaN(date.getTime())) return null;
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  if (!hour) return datePart;
  return `${datePart}, ${hour}:${minute}`;
}

function deliveredSentence(when: string): string {
  const split = when.indexOf(", ");
  if (split === -1) return `Delivered on ${when}.`;
  return `Delivered on ${when.slice(0, split)} at ${when.slice(split + 2)}.`;
}

function itemQuantity(items: OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
    0,
  );
}

function productLines(items: OrderItem[] | null | undefined): OrderProductLine[] {
  if (!items) return [];
  return items
    .filter((item) => item.title.trim() && item.quantity > 0)
    .map((item) => ({ title: item.title.trim(), quantity: item.quantity }));
}

function itemPhrase(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

function verb(count: number): string {
  return count === 1 ? "has" : "have";
}

function trackingNumbers(shipment: OrderShipment): string[] {
  const values = [
    ...(shipment.tracking ?? []).map((entry) => entry.number),
    shipment.tracking_number,
  ];
  const seen = new Set<string>();
  const numbers: string[] = [];
  for (const value of values) {
    const number = value?.trim();
    if (!number || seen.has(number)) continue;
    seen.add(number);
    numbers.push(number);
  }
  return numbers;
}

function uniqueText(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function trackingUrl(shipment: OrderShipment): string | null {
  const candidates = [
    shipment.tracking_url,
    ...(shipment.tracking ?? []).map((entry) => entry.url),
  ];
  for (const candidate of candidates) {
    const url = candidate?.trim();
    if (url) return url;
  }
  return null;
}

function handledBy(shipment: OrderShipment): string | null {
  const carrier = shipment.carrier?.trim().toLowerCase();
  const names = uniqueText(
    (shipment.tracking ?? []).map((entry) => entry.handled_by),
  ).filter((name) => name.toLowerCase() !== carrier);
  return names.length > 0 ? names.join(", ") : null;
}

function trackingService(shipment: OrderShipment): string | null {
  const services = uniqueText((shipment.tracking ?? []).map((entry) => entry.service));
  return services.length > 0 ? services.join(", ") : null;
}

function otherNumbers(shipment: OrderShipment): string[] {
  const primary = new Set(trackingNumbers(shipment).map((number) => number.toLowerCase()));
  return uniqueText(
    (shipment.tracking ?? []).flatMap((entry) => entry.other_numbers ?? []),
  ).filter((number) => !primary.has(number.toLowerCase()));
}

function trackingLinkNote(shipment: OrderShipment, url: string | null): string | null {
  if (url) return null;
  const statuses = [
    shipment.link_status,
    ...(shipment.tracking ?? []).map((entry) => entry.link_status),
  ];
  const missing = statuses.some((status) => {
    const value = status?.trim().toLowerCase();
    return value === "missing" || value === "unavailable";
  });
  if (!missing || trackingNumbers(shipment).length === 0) return null;
  return "A courier tracking link is not available.";
}

function sameLabel(left?: string | null, right?: string | null): boolean {
  const a = left?.trim().toLowerCase();
  const b = right?.trim().toLowerCase();
  return Boolean(a && b && a === b);
}

function trackingEvents(shipment: OrderShipment): OrderTrackingEventView[] {
  return (shipment.events ?? []).flatMap((event) => {
    const label = event.label?.trim() || formatOrderStatus(event.state) || "Update";
    const text = event.text?.trim() || null;
    const location = event.location?.trim() || null;
    const when =
      event.has_time === false
        ? formatOrderDate(event.local ?? event.at)
        : formatWallClock(event.local) ?? formatOrderStamp(event.at);
    if (!label && !text && !when) return [];
    return [
      {
        label,
        text: text && !sameLabel(text, label) ? text : null,
        location,
        when,
      },
    ];
  });
}

function shipmentHeading(shipment: OrderShipment): string {
  const label =
    shipment.state_label?.trim() ||
    formatOrderStatus(shipment.state) ||
    formatOrderStatus(shipment.status) ||
    "Shipment";
  const total = shipment.of ?? 0;
  if (total > 1 && shipment.position) {
    return `${label} (${shipment.position} of ${total})`;
  }
  return label;
}

function shipmentDetail(shipment: OrderShipment): string | null {
  const sentences: string[] = [];
  const hasEvents = (shipment.events?.length ?? 0) > 0;
  const deliveredWhen =
    formatWallClock(shipment.delivered_at_local) ?? formatOrderDate(shipment.delivered_at);
  const shipped = formatOrderDate(shipment.shipped_at);
  const inTransit = formatOrderDate(shipment.in_transit_at);
  const outForDelivery = formatOrderDate(shipment.out_for_delivery_at);
  const pickup = formatOrderDate(shipment.available_for_pickup_at);
  const failed = formatOrderDate(shipment.failed_attempt_at);
  const estimate = formatOrderDate(shipment.estimated_delivery);

  if (deliveredWhen) {
    sentences.push(deliveredSentence(deliveredWhen));
  } else if (hasEvents) {
    if (shipped) sentences.push(`Shipped on ${shipped}.`);
  } else {
    if (shipped) sentences.push(`Shipped on ${shipped}.`);
    if (inTransit && inTransit !== shipped) {
      sentences.push(`In transit since ${inTransit}.`);
    }
    if (outForDelivery) sentences.push(`Out for delivery on ${outForDelivery}.`);
    if (pickup) sentences.push(`Available for pickup since ${pickup}.`);
  }

  if (failed) sentences.push(`A delivery attempt failed on ${failed}.`);
  if (pickup && deliveredWhen == null && hasEvents) {
    sentences.push(`Available for pickup since ${pickup}.`);
  }

  if (!deliveredWhen && estimate) {
    sentences.push(
      shipment.estimate_passed
        ? `The estimated delivery date of ${estimate} has passed.`
        : `Estimated delivery ${estimate}.`,
    );
  }

  const stale = shipment.stale === true || shipment.attention === "no_recent_update";
  if (stale && !deliveredWhen) {
    const since = formatOrderDate(shipment.last_update_at);
    if (shipped && since && since !== shipped) {
      sentences.push(`There has been no tracking update since ${since}.`);
    } else if (shipped) {
      sentences.push("There has been no tracking update since then.");
    } else if (since) {
      sentences.push(`There has been no tracking update since ${since}.`);
    } else {
      sentences.push("There has been no recent tracking update.");
    }
  }

  if (shipment.courier_unavailable) {
    sentences.push("Live courier tracking is not available.");
  }

  if (shipment.conflict) {
    const store = formatOrderStatus(shipment.store_state);
    const courier = formatOrderStatus(shipment.courier_state);
    if (store && courier && store.toLowerCase() !== courier.toLowerCase()) {
      sentences.push(`The store shows ${store}, while the courier shows ${courier}.`);
    } else {
      sentences.push("The store and courier statuses do not match.");
    }
  }

  return sentences.length > 0 ? sentences.join(" ") : null;
}

function cancelledShipmentsNote(count: number): string | null {
  if (count === 1) return "1 shipment on this order was cancelled.";
  if (count > 1) return `${count} shipments on this order were cancelled.`;
  return null;
}

function summaryFor(input: {
  cancelled: boolean;
  shippedQty: number;
  unshippedQty: number | null;
  knowsShippedItems: boolean;
  shipmentCount: number;
}): string | null {
  if (input.cancelled) return "This order was cancelled.";

  const unshippedQty = input.unshippedQty;
  if (input.knowsShippedItems && unshippedQty != null) {
    if (input.shippedQty > 0 && unshippedQty > 0) {
      return `${itemPhrase(input.shippedQty)} ${verb(input.shippedQty)} shipped. ${itemPhrase(unshippedQty)} ${verb(unshippedQty)} not shipped yet.`;
    }
    if (input.shippedQty > 0 && unshippedQty === 0) {
      return "All items in this order have shipped.";
    }
    if (input.shippedQty === 0 && unshippedQty > 0) {
      return "None of the items in this order have shipped yet.";
    }
  }

  if (unshippedQty != null && unshippedQty > 0 && input.shipmentCount === 0) {
    return "None of the items in this order have shipped yet.";
  }

  if (input.knowsShippedItems && unshippedQty == null && input.shippedQty > 0) {
    return `${itemPhrase(input.shippedQty)} ${verb(input.shippedQty)} shipped.`;
  }

  return null;
}

export function buildOrderStatusView(order: VerifiedOrder): OrderStatusView {
  const shipments = order.shipments ?? [];
  const shipmentViews = shipments.map((shipment) => {
    const url = trackingUrl(shipment);
    return {
      heading: shipmentHeading(shipment),
      carrier: shipment.carrier?.trim() || null,
      handledBy: handledBy(shipment),
      service: trackingService(shipment),
      reference: shipment.reference?.trim() || null,
      items: productLines(shipment.items),
      trackingNumbers: trackingNumbers(shipment),
      otherNumbers: otherNumbers(shipment),
      trackingUrl: url,
      trackingLinkNote: trackingLinkNote(shipment, url),
      signedFor: (shipment.tracking ?? []).some((entry) => entry.signed_for === true),
      detail: shipmentDetail(shipment),
      events: trackingEvents(shipment),
    };
  });
  const knowsUnshipped = Array.isArray(order.unshipped_items);
  const unshipped = productLines(order.unshipped_items);
  const shippedQty = shipmentViews.reduce(
    (sum, shipment) => sum + itemQuantity(shipment.items),
    0,
  );
  const knowsShippedItems = shipmentViews.some((shipment) => shipment.items.length > 0);
  const unshippedQty = knowsUnshipped ? itemQuantity(unshipped) : null;
  const listedProducts = knowsShippedItems || unshipped.length > 0;

  let headline = "Verified";
  if (order.cancelled) headline = "Cancelled";
  else if (order.overall_label?.trim()) headline = order.overall_label.trim();
  else if (knowsShippedItems && unshippedQty != null && shippedQty > 0 && unshippedQty > 0) {
    headline = "Partly shipped";
  } else if (unshippedQty != null && unshippedQty > 0 && shippedQty === 0) {
    headline = "Not shipped yet";
  } else if (shipments.length === 1 && shipments[0]?.state_label?.trim()) {
    headline = shipments[0].state_label.trim();
  } else if (order.fulfillment_status) {
    headline = formatOrderStatus(order.fulfillment_status);
  } else if (order.status) {
    headline = formatOrderStatus(order.status);
  }

  const fulfillment = order.fulfillment_status
    ? formatOrderStatus(order.fulfillment_status)
    : null;

  return {
    orderNumber: order.order_number,
    headline,
    summary: summaryFor({
      cancelled: order.cancelled === true,
      shippedQty,
      unshippedQty,
      knowsShippedItems,
      shipmentCount: shipments.length,
    }),
    payment: order.financial_status
      ? formatOrderStatus(order.financial_status)
      : null,
    fulfillment:
      fulfillment && fulfillment.toLowerCase() !== headline.toLowerCase()
        ? fulfillment
        : null,
    placed: formatOrderDate(order.placed_at),
    cancelledOn: order.cancelled ? formatOrderDate(order.cancelled_at) : null,
    checkedAt: formatOrderStamp(order.as_of),
    cancelledShipmentsNote: cancelledShipmentsNote(order.cancelled_shipments ?? 0),
    shipments: shipmentViews,
    unshipped,
    unshippedNote:
      shippedQty > 0 && unshippedQty != null && unshippedQty > 0
        ? unshippedQty === 1
          ? "This item has not been dispatched."
          : "These items have not been dispatched."
        : null,
    otherItems: listedProducts ? [] : productLines(order.items),
  };
}
