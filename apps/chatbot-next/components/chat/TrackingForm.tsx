import { useState, type FormEvent } from "react";
import type {
  SupportOrder,
  SupportShipment,
  SupportStoreCode,
  SupportTracking,
} from "@rdx/chat-contract";
import { cn } from "@rdx/ui/lib/utils";
import { useOrderLookup } from "@/lib/api/use-order-lookup";
import { formatDate, formatDateTime, formatMoney } from "@/lib/chat/format";
import { isSafeHref } from "@/lib/chat/links";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "./form-styles";
import { BoxIcon, ExternalIcon } from "./icons";
import Spinner from "./Spinner";
import TextField from "./TextField";

function ShipmentCard({ shipment, index, total }: { shipment: SupportShipment; index: number; total: number }) {
  const links = shipment.tracking_links.filter(isSafeHref);
  const eta = formatDate(shipment.estimated_delivery);
  const delivered = formatDate(shipment.delivered);
  const events = shipment.latest_events ?? [];
  return (
    <section className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700">
      <p className="font-semibold text-neutral-900">
        {total > 1 ? `Parcel ${index + 1} of ${total}` : "Parcel"}
        {shipment.carrier ? ` · ${shipment.carrier}` : ""}
      </p>
      {shipment.tracking_numbers.map((number) => (
        <p key={number} className="mt-0.5 font-mono break-all text-neutral-600">
          {number}
        </p>
      ))}
      {!delivered && eta && <p className="mt-0.5">Estimated delivery {eta}</p>}
      {delivered && <p className="mt-0.5">Delivered {delivered}</p>}
      {events.length > 0 && (
        <ol className="mt-2 space-y-1.5 border-l border-neutral-200 pl-3" aria-label="Tracking updates">
          {events.map((event, eventIndex) => (
            <li key={`${event.time ?? ""}-${eventIndex}`} className="relative">
              <span
                className={cn(
                  "absolute top-1 -left-[15.5px] h-2 w-2 rounded-full",
                  eventIndex === 0 ? "bg-rdx-red" : "bg-neutral-300",
                )}
              />
              <p className={cn(eventIndex === 0 ? "font-medium text-neutral-900" : "text-neutral-600")}>
                {event.status}
              </p>
              {event.time && <p className="text-[10px] text-neutral-400">{formatDateTime(event.time)}</p>}
            </li>
          ))}
        </ol>
      )}
      {links.map((href) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-semibold text-rdx-red hover:underline"
        >
          Track parcel <ExternalIcon className="h-3 w-3" />
        </a>
      ))}
    </section>
  );
}

function OrderCard({ order, tracking }: { order: SupportOrder; tracking: SupportTracking | null }) {
  const placed = formatDate(order.placed);
  const shipments = tracking?.shipments ?? [];
  const carrierStatus = shipments.length === 1 ? shipments[0].status : null;
  const heading = order.cancelled ? "Cancelled" : (carrierStatus ?? order.status);
  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
            Order {order.order_number}
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-neutral-900 first-letter:uppercase">
            {heading}
          </p>
          <p className="text-[11px] text-neutral-500">
            {[placed && `Placed ${placed}`, order.total && formatMoney(order.total.amount, order.total.currency)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rdx-red/10 text-rdx-red">
          <BoxIcon />
        </span>
      </div>

      {shipments.map((shipment, index) => (
        <ShipmentCard key={index} shipment={shipment} index={index} total={shipments.length} />
      ))}

      {order.items.length > 0 && (
        <div className="mt-3 border-t border-neutral-100 pt-2">
          <p className="text-[11px] font-semibold text-neutral-500">Items</p>
          <ul className="mt-1 space-y-0.5 text-xs text-neutral-700">
            {order.items.map((item, index) => (
              <li key={`${item.sku ?? item.title}-${index}`}>
                {item.quantity} × {item.title}
                {item.variant && <span className="text-neutral-500"> · {item.variant}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tracking?.note && <p className="mt-2 text-[11px] text-neutral-400">{tracking.note}</p>}
    </article>
  );
}

interface TrackingFormProps {
  store: SupportStoreCode;
  initialOrderNumber?: string | null;
  disabled: boolean;
  onAskAgent: (message: string) => void;
}

export default function TrackingForm({ store, initialOrderNumber, disabled, onAskAgent }: TrackingFormProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? "");
  const [contact, setContact] = useState("");
  const { lookup, clear, submitted, result, isLoading, error } = useOrderLookup(store);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    void lookup(orderNumber, contact);
  };

  if (result?.verified) {
    return (
      <div className="mt-3 space-y-2">
        <OrderCard order={result.order} tracking={result.tracking} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              clear();
              setOrderNumber("");
            }}
            className={secondaryButtonClass}
          >
            Track another
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAskAgent(`I have a question about order ${result.order.order_number}`)}
            className={secondaryButtonClass}
          >
            Ask about it
          </button>
        </div>
      </div>
    );
  }

  const notFound = submitted && result && !result.verified && !isLoading;

  return (
    <form onSubmit={handleSubmit} className={cardClass}>
      <div className="grid gap-2 group-data-[expanded=true]/panel:grid-cols-2">
        <TextField
          label="Order number"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="e.g. RDX-UK#123456"
          maxLength={40}
          disabled={isLoading}
        />
        <TextField
          label="Email or postcode"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={120}
          disabled={isLoading}
        />
      </div>
      {(notFound || error) && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error ?? "We couldn't find an order with those details. Please check and try again."}
        </p>
      )}
      <button type="submit" disabled={isLoading} className={cn(primaryButtonClass, "mt-3")}>
        {isLoading && <Spinner />}
        {isLoading ? "Checking…" : "Find my order"}
      </button>
    </form>
  );
}
