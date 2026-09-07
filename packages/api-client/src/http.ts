export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;
  readonly retryAfter?: number;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    extras?: { code?: string; retryAfter?: number },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = extras?.code;
    this.retryAfter = extras?.retryAfter;
  }
}

export type ApiClientOptions = {
  /** Origin only, e.g. https://backend-staging-1a2f.up.railway.app — no trailing slash. */
  baseUrl: string;
  /** Override for tests. */
  fetch?: typeof fetch;
  /** Extra headers sent on every request. */
  headers?: Record<string, string>;
};

export type ApiClient = {
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  readonly headers: Record<string, string>;
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

export function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function parseApiErrorMessage(
  payload: unknown,
  status: number,
): string {
  if (typeof payload === "object" && payload !== null) {
    if ("error" in payload) {
      const error = (payload as { error: unknown }).error;
      if (typeof error === "string" && error.trim()) return error;
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        return (error as { message: string }).message;
      }
    }
    if ("detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object") {
        const first = detail[0] as { msg?: unknown };
        if (typeof first.msg === "string") return first.msg;
      }
    }
  }
  return `Request failed (${status})`;
}

export function parseApiErrorCode(payload: unknown): string | undefined {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "object" &&
    (payload as { error: object }).error !== null &&
    "code" in ((payload as { error: { code?: unknown } }).error)
  ) {
    const code = (payload as { error: { code?: unknown } }).error.code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

function readRetryAfter(response: Response): number | undefined {
  const header =
    typeof response.headers?.get === "function"
      ? response.headers.get("Retry-After")
      : null;
  if (!header) return undefined;
  const seconds = Number.parseFloat(header);
  return Number.isFinite(seconds) ? seconds : undefined;
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
    fetch: fetchImpl,
    headers: defaultHeaders,
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
        throw new ApiError(
          parseApiErrorMessage(payload, response.status),
          response.status,
          payload,
          {
            code: parseApiErrorCode(payload),
            retryAfter: readRetryAfter(response),
          },
        );
      }

      return payload as T;
    },
  };
}
