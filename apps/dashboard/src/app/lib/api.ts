import { createRdxApiClient } from "@rdx/api-client";

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787"
).replace(/\/+$/, "");

/** Shared RDX API client for dashboard features (conversations, etc.). */
export const api = createRdxApiClient({ baseUrl });
