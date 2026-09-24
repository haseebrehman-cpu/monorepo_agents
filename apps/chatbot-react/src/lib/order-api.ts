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

export function shouldOfferOrderVerification(
  result: Pick<ChatSuccessResponse, "skill" | "answer">,
  userText: string,
): boolean {
  return result.skill === "order" || looksLikeOrderTracking(userText);
}

export function getOrderChallenge(input: {
  region?: string | null;
  orderNumber?: string | null;
}) {
  return api.orders.getChallenge({
    ...cartScope(input.region),
    orderNumber: input.orderNumber,
  });
}

export async function resolveOrderVerification(
  result: Pick<ChatSuccessResponse, "skill" | "answer">,
  userText: string,
  region?: string | null,
) {
  if (!shouldOfferOrderVerification(result, userText)) return null;
  return getOrderChallenge({ region });
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
