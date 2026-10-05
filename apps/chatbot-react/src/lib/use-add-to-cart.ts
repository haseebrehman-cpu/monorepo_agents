import { useState } from "react";
import { ApiError } from "@rdx/api-client";
import { MARKETPLACE_CURRENCY, newCartActionId, toMinorUnits } from "./cart-api";
import { readMarketplace } from "./chat-api";
import { noticeFromCartAction, type CartNotice } from "./cart-outcome";
import { useAddCartLine } from "./use-cart";

export type AddToCartInput = {
  listingId: string;
  /** The price the shopper saw, as a decimal string. */
  price: string | null;
  currency?: string | null;
};

/**
 * Adds one line for the variant the shopper is looking at, quoting the price
 * shown so the basket can refuse a change at a price they never saw.
 */
export function useAddToCart(
  region: string,
  onNotice: (notice: CartNotice) => void,
  onListingFailed?: (listingId: string) => void,
) {
  const addLine = useAddCartLine(region);
  const [pending, setPending] = useState(false);

  const add = async (input: AddToCartInput) => {
    if (pending || !input.listingId) return;
    const marketplace = readMarketplace(region);

    setPending(true);
    try {
      const result = await addLine.mutateAsync({
        listingId: input.listingId,
        quantity: 1,
        quotedUnitAmount: toMinorUnits(input.price),
        quotedCurrency: input.currency || MARKETPLACE_CURRENCY[marketplace],
        actionId: newCartActionId(),
      });
      onNotice(noticeFromCartAction(result, "add"));
      if (result.outcome === "failed") {
        onListingFailed?.(input.listingId);
      }
    } catch (error) {
      onNotice({
        kind: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Could not add this item. Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return { add, pending };
}
