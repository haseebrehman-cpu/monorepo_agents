import type { ChatAgentResult } from "@rdx/chat-contract";

/** Temporary demo agent — replace with real LLM/Shopify orchestration later. */
export async function runDemoAgent(
  message: string,
  storeName: string,
): Promise<ChatAgentResult> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const trimmed = message.trim();

  if (/^m$/i.test(trimmed)) {
    return {
      reply: `Here is the main menu for **${storeName}**. Choose an option below.`,
    };
  }

  return {
    reply: [
      `Thanks for your message about **${storeName}**.`,
      "",
      `I received: “${trimmed}”`,
      "",
      "This reply comes from `@rdx/api` demo mode. Swap `runDemoAgent` for the live agent next.",
      "",
      "Reply with **M** for the main menu.",
    ].join("\n"),
  };
}
