/** Server-only. `LIVE_CHAT_API_BASE` is read by name so Next does not inline it at build time. */
export function liveChatApiBaseFromRuntime(): string {
  const runtime = process.env["LIVE_CHAT_API_BASE"];
  const published = process.env.NEXT_PUBLIC_LIVE_CHAT_API_BASE;
  return (runtime || published || "").trim().replace(/\/+$/, "");
}
