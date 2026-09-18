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

const VERIFICATION_ASK =
  /order number|email address|postcode|verify your details|verification/i;

export function defaultOrderChallenge(
  orderReference?: string | null,
): OrderVerificationChallenge {
  return {
    message: "Please enter your order number and the email address used for the order.",
    required: true,
    reason: "verification_required",
    order_reference: orderReference ?? undefined,
    factors: ["email"],
    fields: [
      {
        name: "order_number",
        type: "text",
        label: "Order number",
        max_length: 64,
        required: true,
        autocomplete: "off",
      },
      {
        name: "email",
        type: "email",
        label: "Email address used for the order",
        max_length: 320,
        required: true,
        autocomplete: "email",
      },
    ],
    submit: { method: "POST", path: "/v1/orders/verify" },
    expires_in_seconds: 900,
  };
}

export function looksLikeOrderTracking(text: string): boolean {
  return new RegExp(TRACK_INTENT.source, TRACK_INTENT.flags).test(text);
}

export function shouldOfferOrderVerification(
  result: Pick<ChatSuccessResponse, "skill" | "answer">,
  userText: string,
): boolean {
  if (looksLikeOrderTracking(userText)) return true;
  return (
    result.skill === "order" &&
    new RegExp(VERIFICATION_ASK.source, VERIFICATION_ASK.flags).test(result.answer)
  );
}

export function resolveOrderVerification(
  result: Pick<ChatSuccessResponse, "skill" | "answer">,
  userText: string,
): OrderVerificationChallenge | null {
  if (!shouldOfferOrderVerification(result, userText)) return null;
  return defaultOrderChallenge();
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
