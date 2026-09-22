import type {
  OrderVerificationChallenge,
  OrderVerificationField,
  OrderVerifyRequest,
} from "@rdx/chat-contract";
import { api } from "./chat-api";
import { cartScope } from "./cart-api";

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
