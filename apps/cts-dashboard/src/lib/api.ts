import { createApiClient } from "@rdx/api-client";

export const LOCAL_CTS_API_PROXY = "/cts-api";

export function isLocalBrowserHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function resolveCtsApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_CTS_API_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  // Local Vite stays same-origin so /cts-api can bypass backend CORS/CORP.
  if (isLocalBrowserHost()) {
    return LOCAL_CTS_API_PROXY;
  }

  return configured || "http://localhost:5000";
}

export const CTS_API_BASE_URL = resolveCtsApiBaseUrl();

export function createCtsApi(fetchImpl?: typeof fetch) {
  const request: typeof fetch = fetchImpl ?? ((input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }));

  return createApiClient({
    baseUrl: CTS_API_BASE_URL,
    fetch: request,
  });
}

export const ctsApi = createCtsApi();
