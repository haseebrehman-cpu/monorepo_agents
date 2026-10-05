export const queryKeys = {
  healthz: ["healthz"] as const,
  cart: (region: string) => ["cart", region] as const,
  productVariants: (region: string, listingId: string) =>
    ["products", region, listingId, "variants"] as const,
  turn: (conversationId: string, turnId: string) =>
    ["conversations", conversationId, "turns", turnId] as const,
};
