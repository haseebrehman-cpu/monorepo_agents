import { ApiError } from "@rdx/api-client";
import type {
  CartActionResponse,
  CartAddLineRequest,
  CartSnapshot,
  MarketplaceCode,
} from "@rdx/chat-contract";
import { ulid } from "ulid";
import {
  api,
  hasSessionToken,
  readMarketplace,
  readTenant,
} from "./chat-api";

const SESSION_STORAGE_KEY = "rdx-shopper-session-id";
const INVALID_SESSION_IDS = new Set(["", "anon", "string"]);
const CART_ACTION_ID = /^cact_[0-7][0-9A-HJKMNP-TV-Z]{25}$/;

let memorySessionId: string | null = null;

export const MARKETPLACE_CURRENCY: Record<MarketplaceCode, string> = {
  uk: "GBP",
  usa: "USD",
  ca: "CAD",
  eu: "EUR",
  uae: "AED",
  intl: "USD",
};

export function newCartActionId(): string {
  return `cact_${ulid()}`;
}

export function isCartActionId(value: string): boolean {
  return CART_ACTION_ID.test(value);
}

function createShopperId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `shopper_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function isValidSessionId(value: string | null | undefined): boolean {
  const id = value?.trim() ?? "";
  return !INVALID_SESSION_IDS.has(id.toLowerCase());
}

export function getShopperSessionId(): string {
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (isValidSessionId(stored)) return stored as string;
    const next = createShopperId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  }
  if (!isValidSessionId(memorySessionId)) {
    memorySessionId = createShopperId();
  }
  return memorySessionId as string;
}

export function toMinorUnits(price: string | null | undefined): number | undefined {
  if (!price) return undefined;
  const parsed = Number.parseFloat(price);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.round(parsed * 100);
}

export function cartScope(region?: string | null) {
  if (hasSessionToken()) return {};
  return {
    tenant: readTenant(),
    marketplace: readMarketplace(region ?? undefined),
    sessionId: getShopperSessionId(),
  };
}

function shouldReplayWrite(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;
  return error.status >= 500 || error.status === 408;
}

async function writeOrReplay(
  actionId: string,
  region: string | null | undefined,
  write: () => Promise<CartActionResponse>,
): Promise<CartActionResponse> {
  try {
    const result = await write();
    if (result.outcome === "busy" && result.retryable) {
      return write();
    }
    return result;
  } catch (error) {
    if (!shouldReplayWrite(error)) throw error;
    return api.cart.getAction(actionId, cartScope(region));
  }
}

export type AddCartLineInput = {
  region?: string | null;
  listingId: string;
  quantity: number;
  quotedUnitAmount?: number;
  quotedCurrency?: string;
  actionId?: string;
};

export function getCart(region?: string | null) {
  return api.cart.get(cartScope(region));
}

export function addCartLine(input: AddCartLineInput) {
  const actionId = input.actionId ?? newCartActionId();
  const body: CartAddLineRequest = {
    listing_id: input.listingId,
    quantity: input.quantity,
  };
  if (input.quotedUnitAmount !== undefined) {
    body.quoted_unit_amount = input.quotedUnitAmount;
  }
  if (input.quotedCurrency) {
    body.quoted_currency = input.quotedCurrency;
  }

  return writeOrReplay(actionId, input.region, () =>
    api.cart.addLine(body, { ...cartScope(input.region), actionId }),
  );
}

export function changeCartLine(input: {
  region?: string | null;
  lineRef: string;
  quantity: number;
  actionId?: string;
}) {
  const actionId = input.actionId ?? newCartActionId();
  return writeOrReplay(actionId, input.region, () =>
    api.cart.patchLine(
      input.lineRef,
      { quantity: input.quantity },
      { ...cartScope(input.region), actionId },
    ),
  );
}

export function removeCartLine(input: {
  region?: string | null;
  lineRef: string;
  actionId?: string;
}) {
  const actionId = input.actionId ?? newCartActionId();
  return writeOrReplay(actionId, input.region, () =>
    api.cart.deleteLine(input.lineRef, {
      ...cartScope(input.region),
      actionId,
    }),
  );
}

export function getCartAction(actionId: string, region?: string | null) {
  return api.cart.getAction(actionId, cartScope(region));
}

export function startCheckout(input: {
  region?: string | null;
  actionId?: string;
}) {
  const actionId = input.actionId ?? newCartActionId();
  return writeOrReplay(actionId, input.region, () =>
    api.cart.checkout({ ...cartScope(input.region), actionId }),
  );
}

export function emptyCart(): CartSnapshot {
  return {
    cart_ref: null,
    lines: [],
    empty: true,
    totals_are_estimates: true,
  };
}

export function cartFromAction(result: CartActionResponse): CartSnapshot | null {
  return result.cart ?? null;
}
