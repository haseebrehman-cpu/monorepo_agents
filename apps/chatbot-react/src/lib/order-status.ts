import type { OrderItem, OrderShipment, VerifiedOrder } from "@rdx/chat-contract";

export interface OrderProductLine {
  title: string;
  quantity: number;
}

export interface OrderShipmentView {
  heading: string;
  carrier: string | null;
  items: OrderProductLine[];
  trackingNumbers: string[];
  trackingUrl: string | null;
  detail: string | null;
}

export interface OrderStatusView {
  orderNumber: string;
  headline: string;
  summary: string | null;
  payment: string | null;
  placed: string | null;
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
  const delivered = formatOrderDate(shipment.delivered_at);
  const shipped = formatOrderDate(shipment.shipped_at);
  const estimate = formatOrderDate(shipment.estimated_delivery);

  if (delivered) sentences.push(`Delivered on ${delivered}.`);
  else if (shipped) sentences.push(`Shipped on ${shipped}.`);

  if (!delivered && estimate) {
    sentences.push(
      shipment.estimate_passed
        ? `The estimated delivery date of ${estimate} has passed.`
        : `Estimated delivery ${estimate}.`,
    );
  }

  const stale = shipment.stale === true || shipment.attention === "no_recent_update";
  if (stale && !delivered) {
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

  return sentences.length > 0 ? sentences.join(" ") : null;
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
  const shipmentViews = shipments.map((shipment) => ({
    heading: shipmentHeading(shipment),
    carrier: shipment.carrier?.trim() || null,
    items: productLines(shipment.items),
    trackingNumbers: trackingNumbers(shipment),
    trackingUrl: trackingUrl(shipment),
    detail: shipmentDetail(shipment),
  }));
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
    placed: formatOrderDate(order.placed_at),
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
