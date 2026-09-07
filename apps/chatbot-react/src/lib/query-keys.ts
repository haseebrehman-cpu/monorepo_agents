export const queryKeys = {
  healthz: ["healthz"] as const,
  turn: (conversationId: string, turnId: string) =>
    ["conversations", conversationId, "turns", turnId] as const,
};
