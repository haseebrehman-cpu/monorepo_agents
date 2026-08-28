import { createRdxApiClient } from "@rdx/api-client";

const baseUrl = (
  import.meta.env.VITE_CHAT_API_URL ?? "http://127.0.0.1:8787"
).replace(/\/+$/, "");

/** Shared RDX API client — points at `@rdx/api`. */
export const api = createRdxApiClient({ baseUrl });

export function sendChatMessage(message: string) {
  return api.chat.send(message);
}
