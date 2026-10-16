import type { ChatOption } from "@rdx/chat-contract";

export const STORE_NAME = import.meta.env.VITE_STORE_NAME || "RDX Sports";
export const CHATBOT_ICON_SRC = "/chatbot-icon.png";
export const PANEL_ID = "chat-widget-panel";
export const MAX_INPUT_CHARS = 4000;

export interface MenuOption extends ChatOption {
  /** Longer title used in the full-screen welcome layout. */
  fullLabel: string;
  description: string;
  /** Text sent to the assistant. Labels stay short for the cards. */
  message: string;
}

export interface QuickQuestion {
  id: string;
  label: string;
  message: string;
}

export const OPTIONS: MenuOption[] = [
  {
    id: "product-info",
    label: "Product Information",
    fullLabel: "Product Information",
    description: "Get full product information, features, sizes and specifications.",
    message: "Product Information",
    enabled: true,
  },
  {
    id: "track-order",
    label: "Track Your Order",
    fullLabel: "Track your order",
    description: "Get the latest updates on your order and delivery status.",
    message: "Track Your Order",
    enabled: true,
  },
  // {
  //   id: "find-products",
  //   label: "Find products",
  //   fullLabel: "Find products",
  //   description: "Browse our range, search by category, size, colour or use.",
  //   message: "Find products",
  //   enabled: true,
  // },
  {
    id: "refund-return",
    label: "Refund & Return",
    fullLabel: "Refunds & Returns",
    description: "Learn about our returns process and refund policy.",
    message: "Refunds & Returns",
    enabled: true,
  },
  {
    id: "damaged-product",
    label: "Damage Product",
    fullLabel: "Damaged Product",
    description: "Report a damaged product and we'll help you sort it out.",
    message: "Damaged Product",
    enabled: true,
  },
  {
    id: "talk-human",
    label: "Talk to a human",
    fullLabel: "Talk to a Human",
    description: "Need extra help? Get in touch with our support team.",
    message: "Talk to a human",
    enabled: true,
  },
];

export const POPULAR_QUESTIONS: QuickQuestion[] = [
  {
    id: "competition-gloves",
    label: "Boxing Gloves",
    message: "Show me boxing gloves",
  },
  {
    id: "punch-pads",
    label: "Punch Bags",
    message: "Show me punch bags",
  },
  {
    id: "weightlifting",
    label: "Weightlifting Gear",
    message: "Show me weightlifting gear",
  },
];
