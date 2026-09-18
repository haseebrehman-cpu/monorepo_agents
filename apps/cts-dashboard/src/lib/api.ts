import { createApiClient } from "@rdx/api-client";

export const CTS_API_BASE_URL = (
  import.meta.env.VITE_CTS_API_URL ?? "http://localhost:5000"
).replace(/\/+$/, "");

export function createCtsApi(token?: string | null) {
  return createApiClient({
    baseUrl: CTS_API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export const ctsApi = createCtsApi();
