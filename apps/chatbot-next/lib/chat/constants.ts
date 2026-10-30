import { SUPPORT_MESSAGE_MAX_CHARS } from "@rdx/api-client";
import type { SupportStoreCode } from "@rdx/chat-contract";

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "RDX Sports";
export const CHATBOT_ICON_SRC = "/chatbot-icon.png";
export const PANEL_ID = "rdx-chat-panel";
export const MAX_INPUT_CHARS = SUPPORT_MESSAGE_MAX_CHARS;
export const DEFAULT_STORE: SupportStoreCode = "uk";

export interface StoreOption {
  value: SupportStoreCode;
  label: string;
  shortLabel: string;
}

export const STORES: StoreOption[] = [
  { value: "uk", label: "United Kingdom", shortLabel: "UK" },
  { value: "usa", label: "United States", shortLabel: "US" },
  { value: "eu", label: "Europe", shortLabel: "EU" },
  { value: "ca", label: "Canada", shortLabel: "CA" },
  { value: "uae", label: "UAE", shortLabel: "UAE" },
  { value: "intl", label: "International", shortLabel: "INTL" },
];

export function storeOption(store: SupportStoreCode): StoreOption {
  return STORES.find((option) => option.value === store) ?? STORES[0];
}

export type MenuOptionId =
  | "product-info"
  | "track-order"
  | "refund-return"
  | "damaged-product"
  | "talk-human";

export interface MenuOption {
  id: MenuOptionId;
  label: string;
  description: string;
  message: string;
}

export const MENU_OPTIONS: MenuOption[] = [
  {
    id: "product-info",
    label: "Product information",
    description: "Features, sizes and specs for any RDX product.",
    message: "I want to know about your products",
  },
  {
    id: "track-order",
    label: "Track your order",
    description: "Latest updates on your order and delivery.",
    message: "Where is my order?",
  },
  {
    id: "refund-return",
    label: "Refunds & returns",
    description: "Our returns process and refund policy.",
    message: "What is your returns and refund policy?",
  },
  {
    id: "damaged-product",
    label: "Damaged product",
    description: "Report a damaged item and we'll sort it out.",
    message: "My product arrived damaged",
  },
  {
    id: "talk-human",
    label: "Talk to a human",
    description: "Get in touch with our support team.",
    message: "I want to talk to a person",
  },
];

export interface QuickQuestion {
  id: string;
  label: string;
  message: string;
}

export const POPULAR_QUESTIONS: QuickQuestion[] = [
  { id: "boxing-gloves", label: "Boxing gloves", message: "Show me boxing gloves" },
  { id: "gym-belts", label: "Gym belts", message: "Show me gym belts" },
  { id: "weightlifting", label: "Weightlifting gear", message: "Show me weightlifting gear" },
  { id: "punch-bags", label: "Punch bags", message: "Show me punch bags" },
];
