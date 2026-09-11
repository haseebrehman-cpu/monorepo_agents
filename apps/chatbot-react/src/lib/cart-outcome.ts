import { useEffect, useState } from "react";
import type { CartActionResponse, CartOutcome } from "@rdx/chat-contract";

export type CartNoticeKind = "success" | "warning" | "error" | "info";

export type CartNotice = {
  kind: CartNoticeKind;
  text: string;
};

export const CART_NOTICE_DISMISS_MS = 2000;

export function useTimedCartNotice() {
  const [notice, setNotice] = useState<CartNotice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), CART_NOTICE_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return [notice, setNotice] as const;
}

const UNCERTAIN: CartOutcome[] = ["unknown", "unresolved"];

export function isUncertainOutcome(outcome: CartOutcome | undefined): boolean {
  return outcome !== undefined && UNCERTAIN.includes(outcome);
}

export function noticeFromCartAction(
  result: CartActionResponse,
  context: "add" | "change" | "remove" | "checkout",
): CartNotice {
  const reason = result.reason?.trim();

  switch (result.outcome) {
    case "succeeded":
      if (context === "checkout") {
        return {
          kind: "info",
          text: "Continue on the store checkout to finish. No order is placed yet.",
        };
      }
      if (context === "add") {
        return { kind: "success", text: "Added to your bag." };
      }
      if (context === "remove") {
        return { kind: "success", text: "Removed from your bag." };
      }
      return { kind: "success", text: "Bag updated." };

    case "adjusted":
      return {
        kind: "warning",
        text:
          result.resulting_quantity !== undefined
            ? `Quantity was updated to ${result.resulting_quantity}.`
            : "Quantity was adjusted by the store.",
      };

    case "failed":
      return {
        kind: "error",
        text: reason || "This item could not be added.",
      };

    case "quote_stale":
      return {
        kind: "warning",
        text: reason || "The live price changed. Check the card and try again.",
      };

    case "unknown":
    case "unresolved":
      return {
        kind: "warning",
        text: "We're not sure that went through. Check your bag before adding more.",
      };

    case "busy":
      return {
        kind: "info",
        text: "Another change is still in progress. Try again in a moment.",
      };

    case "not_found":
      return {
        kind: "error",
        text: reason || "That bag item is no longer available.",
      };

    case "invalid":
      return {
        kind: "error",
        text: reason || "That change no longer applies. Your bag was refreshed.",
      };

    default:
      return {
        kind: "error",
        text: reason || "Something went wrong with your bag.",
      };
  }
}
