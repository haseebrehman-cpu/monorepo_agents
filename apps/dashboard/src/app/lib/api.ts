import { createRdxApiClient } from "@rdx/api-client";

const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ??
  "https://backend-staging-1a2f.up.railway.app"
).replace(/\/+$/, "");

/** Shared RDX API client for dashboard features (conversations, etc.). */
export const api = createRdxApiClient({ baseUrl });
