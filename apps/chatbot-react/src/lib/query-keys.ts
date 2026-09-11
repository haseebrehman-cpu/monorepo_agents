export const queryKeys = {
  healthz: ["healthz"] as const,
  cart: (region: string) => ["cart", region] as const,
  turn: (conversationId: string, turnId: string) =>
    ["conversations", conversationId, "turns", turnId] as const,
};
