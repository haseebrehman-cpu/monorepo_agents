import { createApiClient } from "@rdx/api-client";

const baseUrl = (
  import.meta.env.VITE_CTS_API_URL ?? "http://localhost:5000"
).replace(/\/+$/, "");

export function createCtsApi(token?: string | null) {
  return createApiClient({
    baseUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export const ctsApi = createCtsApi();
