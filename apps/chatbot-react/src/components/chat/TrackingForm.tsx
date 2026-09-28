import { useMemo, useState, type FormEvent } from "react";
import { ApiError } from "@rdx/api-client";
import type {
  OrderVerificationChallenge,
  OrderVerifyResponse,
} from "@rdx/chat-contract";
import {
  buildOrderVerifyBody,
  getOrderVerificationInitialValues,
} from "@/lib/order-api";
import {
  buildOrderStatusView,
  type OrderProductLine,
  type OrderTrackingEventView,
} from "@/lib/order-status";
import { useVerifyOrder } from "@/lib/use-order-verify";
import { isAllowedChatHref } from "@/lib/url-allowlist";

function ProductLines({ items }: { items: OrderProductLine[] }) {
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="break-words">
          {item.quantity} × {item.title}
        </li>
      ))}
    </ul>
  );
}

function TrackingTimeline({ events }: { events: OrderTrackingEventView[] }) {
  if (events.length === 0) return null;
  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <p className="text-[11px] font-medium text-slate-500">Tracking updates</p>
      <ol className="mt-1.5 space-y-2">
        {events.map((event, index) => (
          <li key={`${event.label}-${event.when ?? "time"}-${index}`} className="flex gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${index === 0 ? "bg-rdx-red" : "bg-slate-300"
                }`}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="font-medium text-slate-800">{event.label}</span>
              {event.when && <span className="text-slate-500"> · {event.when}</span>}
              {event.text && (
                <span className="mt-0.5 block leading-relaxed text-slate-500">
                  {event.text}
                </span>
              )}
              {event.location && (
                <span className="mt-0.5 block text-slate-400">{event.location}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const RESULT_ISSUES = [
  {
    id: "wrong-status",
    label: "Status looks wrong",
    sentence: "The status does not match what I expected.",
  },
  {
    id: "delayed",
    label: "Delivery is delayed",
    sentence: "The delivery is taking longer than it should.",
  },
  {
    id: "missing",
    label: "Items are missing",
    sentence: "Something from this order is missing.",
  },
  {
    id: "other",
    label: "Something else",
    sentence: "Something else about this result is wrong.",
  },
] as const;

type ResultIssueId = (typeof RESULT_ISSUES)[number]["id"];

const primaryButtonClass =
  "mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rdx-red/40 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg border border-rdx-red bg-white px-3 text-[12px] font-semibold text-rdx-red transition hover:bg-rdx-red hover:text-white disabled:opacity-50";

function buildResultFollowUp(
  orderNumber: string | null,
  issue: (typeof RESULT_ISSUES)[number],
  note: string,
): string {
  const subject = orderNumber ? `order ${orderNumber}` : "this order";
  const extra = note.trim();
  return [
    `I'm not satisfied with the tracking result for ${subject}.`,
    issue.sentence,
    extra ? `Details: ${extra}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPersonHandoff(orderNumber: string | null, note: string): string {
  const reference = orderNumber ? ` Order number ${orderNumber}.` : "";
  const extra = note.trim();
  return [
    `I could not verify my order and I need to talk to a person.${reference}`,
    extra ? `What I know: ${extra}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function OrderStatusCard({ result }: { result: OrderVerifyResponse }) {
  const order = result.order;
  if (result.detail_unavailable || !order) {
    return (
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
        <p className="text-[13px] text-slate-800">
          Your order is verified, but details are not available right now.
        </p>
        {result.note && (
          <p className="mt-1.5 text-[11px] text-slate-500">{result.note}</p>
        )}
      </div>
    );
  }

  const view = buildOrderStatusView(order);
  const facts = [
    view.payment ? `Payment ${view.payment}` : null,
    view.fulfillment,
    view.placed ? `Placed ${view.placed}` : null,
    view.cancelledOn ? `Cancelled ${view.cancelledOn}` : null,
  ].filter(Boolean);

  return (
    <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        Order {view.orderNumber}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">{view.headline}</p>
      {view.summary && (
        <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{view.summary}</p>
      )}
      {facts.length > 0 && (
        <p className="mt-1 text-[12px] text-slate-500">{facts.join(" · ")}</p>
      )}

      {view.shipments.map((shipment, index) => {
        const href = isAllowedChatHref(shipment.trackingUrl ?? undefined)
          ? shipment.trackingUrl
          : null;
        return (
          <section
            key={`${shipment.heading}-${index}`}
            className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] text-slate-700"
          >
            <p className="font-medium text-slate-900">
              {shipment.heading}
              {shipment.carrier ? ` · ${shipment.carrier}` : ""}
            </p>
            {shipment.handledBy && (
              <p className="mt-0.5 text-slate-600">Handled by {shipment.handledBy}</p>
            )}
            {shipment.service && (
              <p className="mt-0.5 text-slate-600">{shipment.service}</p>
            )}
            {shipment.reference && (
              <p className="mt-0.5 break-all text-slate-500">
                Shipment {shipment.reference}
              </p>
            )}
            {shipment.items.length > 0 && <ProductLines items={shipment.items} />}
            {shipment.trackingNumbers.map((number) => (
              <p key={number} className="mt-1.5 break-all text-slate-600">
                Tracking number{" "}
                <span className="font-medium text-slate-900">{number}</span>
              </p>
            ))}
            {shipment.otherNumbers.length > 0 && (
              <p className="mt-1 break-all text-slate-500">
                Also tracked as {shipment.otherNumbers.join(", ")}
              </p>
            )}
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-medium text-rdx-red hover:underline"
              >
                Track shipment
              </a>
            )}
            {shipment.trackingLinkNote && (
              <p className="mt-1 leading-relaxed text-slate-500">
                {shipment.trackingLinkNote}
              </p>
            )}
            {shipment.signedFor && (
              <p className="mt-1 text-slate-600">Signed for on delivery</p>
            )}
            {shipment.detail && (
              <p className="mt-1 leading-relaxed text-slate-500">{shipment.detail}</p>
            )}
            <TrackingTimeline events={shipment.events} />
          </section>
        );
      })}

      {view.unshipped.length > 0 && (
        <section className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[12px] text-amber-950">
          <p className="font-medium">Not shipped yet</p>
          <ProductLines items={view.unshipped} />
          {view.unshippedNote && (
            <p className="mt-1.5 leading-relaxed text-amber-800">{view.unshippedNote}</p>
          )}
        </section>
      )}

      {view.otherItems.length > 0 && (
        <div className="mt-2 border-t border-slate-200/80 pt-2 text-[12px] text-slate-700">
          <p className="font-medium text-slate-900">Items</p>
          <ProductLines items={view.otherItems} />
        </div>
      )}

      {view.cancelledShipmentsNote && (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
          {view.cancelledShipmentsNote}
        </p>
      )}
      {view.checkedAt && (
        <p className="mt-2 text-[11px] text-slate-400">
          Tracking checked {view.checkedAt}
        </p>
      )}
      {result.note && (
        <p className="mt-2 text-[11px] text-slate-500">{result.note}</p>
      )}
    </article>
  );
}

export default function TrackingForm({
  challenge,
  region,
  disabled = false,
  hideMessage = false,
  onNotSatisfied,
  onTalkToPerson,
}: {
  challenge: OrderVerificationChallenge;
  region: string;
  disabled?: boolean;
  hideMessage?: boolean;
  onNotSatisfied?: (message: string) => void;
  onTalkToPerson?: (message: string) => void;
}) {
  const [descriptor, setDescriptor] = useState(challenge);
  const [values, setValues] = useState(() =>
    getOrderVerificationInitialValues(challenge),
  );
  const [result, setResult] = useState<OrderVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<"result" | "person" | null>(null);
  const [issueId, setIssueId] = useState<ResultIssueId | null>(null);
  const [note, setNote] = useState("");
  const verify = useVerifyOrder(region);

  const fields = useMemo(() => descriptor.fields, [descriptor.fields]);

  const orderNumber =
    [result?.order?.order_number, values.order_number, descriptor.order_reference]
      .map((value) => value?.trim())
      .find((value) => Boolean(value)) ?? null;

  const resetFollowUp = () => {
    setFollowUp(null);
    setIssueId(null);
    setNote("");
  };

  const handleTrackAnother = () => {
    setResult(null);
    setError(null);
    resetFollowUp();
    setDescriptor(challenge);
    setValues(
      Object.fromEntries(challenge.fields.map((field) => [field.name, ""])),
    );
  };

  const selectedIssue = RESULT_ISSUES.find((issue) => issue.id === issueId);
  const noteRequired = selectedIssue?.id === "other";
  const canSendResult =
    Boolean(selectedIssue) && (!noteRequired || note.trim().length > 0);

  if (result?.verified) {
    return (
      <div>
        <OrderStatusCard result={result} />
        {followUp === "result" ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
            <p className="text-[12px] font-medium text-slate-800">
              What is wrong with this result?
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              The assistant will look at this order again. This does not connect
              you to a person.
            </p>
            <div className="mt-2 space-y-1.5" role="radiogroup" aria-label="What is wrong">
              {RESULT_ISSUES.map((issue) => (
                <label
                  key={issue.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800"
                >
                  <input
                    type="radio"
                    name="result-issue"
                    value={issue.id}
                    checked={issueId === issue.id}
                    disabled={disabled}
                    onChange={() => setIssueId(issue.id)}
                    className="accent-rdx-red"
                  />
                  {issue.label}
                </label>
              ))}
            </div>
            <label className="mt-2 block">
              <span className="mb-1 block text-[11px] font-medium text-slate-600">
                {noteRequired ? "Tell us more" : "Anything else (optional)"}
              </span>
              <textarea
                value={note}
                disabled={disabled}
                rows={2}
                maxLength={400}
                onChange={(event) => setNote(event.target.value)}
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60"
              />
            </label>
            <button
              type="button"
              disabled={disabled || !canSendResult}
              onClick={() => {
                if (!selectedIssue) return;
                onNotSatisfied?.(
                  buildResultFollowUp(orderNumber, selectedIssue, note),
                );
              }}
              className={primaryButtonClass}
            >
              Ask the assistant
            </button>
            <button
              type="button"
              onClick={resetFollowUp}
              disabled={disabled}
              className={secondaryButtonClass}
            >
              Back
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleTrackAnother}
              disabled={disabled}
              className={primaryButtonClass}
            >
              Track another order
            </button>
            <button
              type="button"
              onClick={() => setFollowUp("result")}
              disabled={disabled}
              className={secondaryButtonClass}
            >
              Not satisfied?
            </button>
          </>
        )}
      </div>
    );
  }

  const locked = result?.locked === true;
  const formDisabled = disabled || locked || verify.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formDisabled) return;
    setError(null);

    try {
      const next = await verify.mutateAsync(
        buildOrderVerifyBody(fields, values),
      );
      setResult(next);
      if (next.challenge) {
        setDescriptor(next.challenge);
        setValues((prev) => ({
          ...getOrderVerificationInitialValues(next.challenge!),
          ...prev,
        }));
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not verify this order. Please try again.",
      );
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left"
    >
      {descriptor.message && !hideMessage && (
        <p className="mb-2 text-[12px] text-slate-700">{descriptor.message}</p>
      )}
      {result?.message && (
        <p className="mb-2 text-[12px] text-slate-800" role="status">
          {result.message}
          {typeof result.attempts_remaining === "number" && !locked && (
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {result.attempts_remaining}{" "}
              {result.attempts_remaining === 1 ? "attempt" : "attempts"} remaining
            </span>
          )}
        </p>
      )}
      {error && (
        <p className="mb-2 text-[12px] text-red-700" role="alert">
          {error}
        </p>
      )}

      {followUp === "person" ? (
        <div>
          <p className="text-[12px] font-medium text-slate-800">
            Talk to a person
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            A person will take over this chat to look up the order we could not
            verify.
          </p>
          <label className="mt-2 block">
            <span className="mb-1 block text-[11px] font-medium text-slate-600">
              What should they know? (optional)
            </span>
            <textarea
              value={note}
              disabled={disabled}
              rows={2}
              maxLength={400}
              onChange={(event) => setNote(event.target.value)}
              className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60"
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onTalkToPerson?.(buildPersonHandoff(orderNumber, note))
            }
            className={primaryButtonClass}
          >
            Connect me
          </button>
          <button
            type="button"
            onClick={resetFollowUp}
            disabled={disabled}
            className={secondaryButtonClass}
          >
            Back
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-600">
                  {field.label}
                  {field.required ? "" : " (optional)"}
                </span>
                <input
                  name={field.name}
                  type={field.type || "text"}
                  required={field.required}
                  maxLength={field.max_length}
                  autoComplete={field.autocomplete}
                  value={values[field.name] ?? ""}
                  disabled={formDisabled}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: event.target.value,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-rdx-red focus:ring-1 focus:ring-rdx-red focus:outline-none disabled:opacity-60"
                />
              </label>
            ))}
          </div>

          {!locked && (
            <button
              type="submit"
              disabled={formDisabled}
              className={primaryButtonClass}
            >
              {verify.isPending ? "Verifying…" : "Verify order"}
            </button>
          )}

          {result?.escalation_offered && (
            <button
              type="button"
              onClick={() => setFollowUp("person")}
              disabled={disabled}
              className={secondaryButtonClass}
            >
              Talk to a person
            </button>
          )}
        </>
      )}
    </form>
  );
}
