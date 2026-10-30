"use client";

import { createContext, useContext } from "react";
import type { SupportProduct, SupportStoreCode } from "@rdx/chat-contract";
import type { SendOptions } from "@/lib/chat/use-support-chat";

export interface ChatActions {
  store: SupportStoreCode;
  isTyping: boolean;
  send: (text: string, options?: SendOptions) => void;
  addToBag: (product: SupportProduct) => void;
  viewProduct: (product: SupportProduct) => void;
  quantityInBag: (productId: string) => number;
}

const ChatActionsContext = createContext<ChatActions | null>(null);

export const ChatActionsProvider = ChatActionsContext.Provider;

export function useChatActions(): ChatActions {
  const actions = useContext(ChatActionsContext);
  if (!actions) throw new Error("useChatActions must be used inside ChatActionsProvider");
  return actions;
}
