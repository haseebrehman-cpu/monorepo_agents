import { useMemo, useState, type FormEvent } from "react";
import { ApiError } from "@rdx/api-client";
import type {
  OrderVerificationChallenge,
  OrderVerificationField,
  OrderVerifyResponse,
} from "@rdx/chat-contract";
import { buildOrderVerifyBody } from "@/lib/order-api";
import { useVerifyOrder } from "@/lib/use-order-verify";
import { isAllowedChatHref } from "@/lib/url-allowlist";

function fieldInputType(field: OrderVerificationField): string {
  return field.type === "email" ? "email" : "text";
}

function initialValues(
  challenge: OrderVerificationChallenge,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of challenge.fields) {
    values[field.name] =
      field.name === "order_number" && challenge.order_reference
        ? challenge.order_reference
        : "";
  }
  return values;
}

function formatStatus(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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

  return (
    <article className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        Order {order.order_number}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">
        {formatStatus(order.status) || "Verified"}
      </p>
      <dl className="mt-1.5 space-y-0.5 text-[12px] text-slate-600">
        {order.financial_status && (
          <div>
            <dt className="inline text-slate-500">Payment: </dt>
            <dd className="inline">{formatStatus(order.financial_status)}</dd>
          </div>
        )}
        {order.fulfillment_status && (
          <div>
            <dt className="inline text-slate-500">Fulfilment: </dt>
            <dd className="inline">{formatStatus(order.fulfillment_status)}</dd>
          </div>
        )}
        {order.placed_at && (
          <div>
            <dt className="inline text-slate-500">Placed: </dt>
            <dd className="inline">{order.placed_at}</dd>
          </div>
        )}
      </dl>
      {order.items && order.items.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-slate-200/80 pt-2 text-[12px] text-slate-700">
          {order.items.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              {item.quantity} × {item.title}
            </li>
          ))}
        </ul>
      )}
      {order.shipments?.map((shipment, index) => {
        const href = isAllowedChatHref(shipment.tracking_url ?? undefined)
          ? shipment.tracking_url
          : null;
        return (
          <div
            key={`${shipment.carrier ?? "shipment"}-${index}`}
            className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] text-slate-700"
          >
            <p className="font-medium text-slate-900">
              {shipment.carrier || "Shipment"}
              {shipment.status ? ` · ${formatStatus(shipment.status)}` : ""}
            </p>
            {shipment.estimated_delivery && (
              <p className="mt-0.5 text-slate-500">
                Est. delivery {shipment.estimated_delivery}
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
          </div>
        );
      })}
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
  onEscalate,
}: {
  challenge: OrderVerificationChallenge;
  region: string;
  disabled?: boolean;
  onEscalate?: () => void;
}) {
  const [descriptor, setDescriptor] = useState(challenge);
  const [values, setValues] = useState(() => initialValues(challenge));
  const [result, setResult] = useState<OrderVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verify = useVerifyOrder(region);

  const fields = useMemo(
    () => descriptor.fields.filter((field) => field.type !== "password"),
    [descriptor.fields],
  );

  if (result?.verified) {
    return <OrderStatusCard result={result} />;
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
        setValues((prev) => ({ ...initialValues(next.challenge!), ...prev }));
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
      {descriptor.message && (
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

      <div className="space-y-2">
        {fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-[11px] font-medium text-slate-600">
              {field.label}
              {field.required ? "" : " (optional)"}
            </span>
            <input
              name={field.name}
              type={fieldInputType(field)}
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
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-rdx-red px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-rdx-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rdx-red/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {verify.isPending ? "Verifying…" : "Verify order"}
        </button>
      )}

      {locked && result?.escalation_offered && onEscalate && (
        <button
          type="button"
          onClick={onEscalate}
          disabled={disabled}
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg border border-rdx-red bg-white px-3 text-[12px] font-semibold text-rdx-red transition hover:bg-rdx-red hover:text-white disabled:opacity-50"
        >
          Talk to a person
        </button>
      )}
    </form>
  );
}
