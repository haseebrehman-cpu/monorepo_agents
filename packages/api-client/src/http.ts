export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiClientOptions = {
  /** Origin only, e.g. http://127.0.0.1:8787 — no trailing slash. */
  baseUrl: string;
  /** Override for tests. */
  fetch?: typeof fetch;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
};

export type ApiClient = {
  readonly baseUrl: string;
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("createApiClient requires a non-empty baseUrl");
  }

  const fetchImpl = options.fetch ?? fetch;
  const defaultHeaders = options.headers ?? {};

  return {
    baseUrl,
    async request<T>(path: string, init: RequestInit = {}): Promise<T> {
      const headers = new Headers(init.headers);
      for (const [key, value] of Object.entries(defaultHeaders)) {
        if (!headers.has(key)) headers.set(key, value);
      }
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }

      const response = await fetchImpl(joinUrl(baseUrl, path), {
        ...init,
        headers,
      });

      let payload: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text) as unknown;
        } catch {
          throw new ApiError(
            "The API returned an invalid JSON response.",
            response.status,
            text,
          );
        }
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : `Request failed (${response.status})`;
        throw new ApiError(message, response.status, payload);
      }

      return payload as T;
    },
  };
}
