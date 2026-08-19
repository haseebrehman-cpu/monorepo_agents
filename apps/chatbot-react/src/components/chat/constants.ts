import type { ChatOption } from "@rdx/chat-contract";

export const STORE_NAME = import.meta.env.VITE_STORE_NAME || "RDX Store";
export const PANEL_ID = "chat-widget-panel";
export const MAX_INPUT_CHARS = 2000;
export const OPTIONS: ChatOption[] = [
  { id: "track-order", label: "Track Your Order", enabled: false },
  { id: "product-info", label: "Product Information", enabled: true },
  { id: "place-order", label: "Place an Order", enabled: false },
  { id: "refund-return", label: "Refunds & Returns", enabled: false },
  { id: "damaged-product", label: "Report a Damaged Product", enabled: false },
];
