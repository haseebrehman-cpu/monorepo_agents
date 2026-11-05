import type { SupportToolOutcome } from "@rdx/chat-contract";

const READ_TOOL = /^(get|read|view|show|list|fetch|describe|inspect)[-_]/;

/** A streamed tool event that changed the conversation's Shopify cart. */
export function toolMutatedCart(tool: string, outcome: SupportToolOutcome): boolean {
  if (outcome !== "ok") return false;
  const name = tool.trim().toLowerCase();
  if (!name.includes("cart") && !name.includes("bag")) return false;
  return !READ_TOOL.test(name);
}
