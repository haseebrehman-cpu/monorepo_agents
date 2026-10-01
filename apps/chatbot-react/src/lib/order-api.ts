import type {
  ChatSuccessResponse,
  OrderVerificationChallenge,
  OrderVerificationField,
  OrderVerifyRequest,
} from "@rdx/chat-contract";
import { api } from "./chat-api";
import { cartScope } from "./cart-api";

const TRACK_INTENT =
  /\btrack(?:ing)?(?:\s+(?:your|my|an?))?\s+order\b|\bwhere(?:'s| is)\s+my\s+order\b|\border\s+(?:status|tracking)\b/i;

export function looksLikeOrderTracking(text: string): boolean {
  return new RegExp(TRACK_INTENT.source, TRACK_INTENT.flags).test(text);
}

const DEFAULT_ORDER_TRACKING: OrderVerificationChallenge = {
  required: true,
  reason: "verification_required",
  factors: ["email"],
  fields: [
    {
      name: "order_number",
      type: "text",
      label: "Order number",
      required: true,
    },
    {
      name: "email",
      type: "email",
      label: "Email address",
      required: true,
      autocomplete: "email",
    },
  ],
  submit: { method: "POST", path: "/v1/orders/verify" },
};

/** Form only on this turn: chat skill is order and the customer asked to track. */
export function orderTrackingForm(
  result: Pick<ChatSuccessResponse, "skill" | "order_verification">,
  userText: string,
): OrderVerificationChallenge | null {
  if (result.skill !== "order") return null;
  if (!looksLikeOrderTracking(userText)) return null;
  const fromChat = result.order_verification;
  if (fromChat && fromChat.fields.length > 0) return fromChat;
  return DEFAULT_ORDER_TRACKING;
}

export function getOrderVerificationInitialValues(
  challenge: OrderVerificationChallenge,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of challenge.fields) {
    const orderReference =
      field.name === "order_number" ? challenge.order_reference : null;
    values[field.name] =
      field.value ?? challenge.values?.[field.name] ?? orderReference ?? "";
  }
  return values;
}

export function buildOrderVerifyBody(
  fields: OrderVerificationField[],
  values: Record<string, string>,
): OrderVerifyRequest {
  const body: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (value == null || value === "") continue;
    body[field.name] = value;
  }
  return body as unknown as OrderVerifyRequest;
}

export function verifyOrder(input: {
  region?: string | null;
  body: OrderVerifyRequest;
}) {
  return api.orders.verify(input.body, cartScope(input.region));
}
