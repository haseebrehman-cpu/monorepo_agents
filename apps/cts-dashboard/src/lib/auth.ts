import { ApiError } from "@rdx/api-client";
import { createCtsApi, ctsApi } from "./api";
import { createRefreshGate } from "./refresh-gate";
import {
  getHomePath as homePathForUser,
  isAdminUser as hasAdminRole,
  isSuperAdminUser as hasSuperAdminRole,
} from "./permissions";

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
  department?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

export type LoginResponse = {
  success: true;
  data: {
    user: AuthUser;
  };
};

export type MeResponse = {
  success: true;
  user: AuthUser & {
    is_active?: boolean;
    created_at?: string;
    roles: string[];
    permissions: string[];
  };
};

export function clearLegacyAuthStorage(): void {
  localStorage.removeItem("cts_token");
  localStorage.removeItem("cts_user");
}

export function isAdminUser(user?: AuthUser | null): boolean {
  return hasAdminRole(user);
}

export function isSuperAdminUser(user?: AuthUser | null): boolean {
  return hasSuperAdminRole(user);
}

export function getHomePath(user?: AuthUser | null): string {
  return homePathForUser(user);
}

let isRedirectingToLogin = false;

function handleUnauthorized(): void {
  if (
    typeof window !== "undefined" &&
    !isRedirectingToLogin &&
    !window.location.pathname.endsWith("/login")
  ) {
    isRedirectingToLogin = true;
    window.location.replace(`${import.meta.env.BASE_URL}login`);
  }
}

const refreshSession = createRefreshGate(() =>
  ctsApi.request<{ success: true }>("/api/auth/refresh", { method: "POST" }).then(() => undefined)
);

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function isTerminalAuthFailure(response: Response): Promise<boolean> {
  try {
    const body = await response.clone().json();
    return body?.error === "SESSION_REVOKED" || body?.error === "USER_INACTIVE";
  } catch {
    return false;
  }
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const response = await fetchImpl(input, init);
  if (response.status !== 401 || requestUrl(input).includes("/api/auth/refresh")) {
    return response;
  }
  if (await isTerminalAuthFailure(response)) {
    handleUnauthorized();
    return response;
  }

  try {
    await refreshSession();
  } catch {
    handleUnauthorized();
    return response;
  }

  const retry = await fetchImpl(input, init);
  if (retry.status === 401) handleUnauthorized();
  return retry;
}

export function authedApi() {
  const api = createCtsApi();
  const fetchRequest = api.fetch;

  return createCtsApi((input, init) => authorizedFetch(input, init, fetchRequest));
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return ctsApi.request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMe(): Promise<MeResponse> {
  return authedApi().request<MeResponse>("/api/auth/me");
}

export function logout(): Promise<{ success: true }> {
  return authedApi().request<{ success: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message === "INVALID_CREDENTIALS" || error.status === 401) {
      return "Invalid email or password.";
    }
    if (error.message === "USER_INACTIVE") {
      return "This account has been deactivated.";
    }
    if (error.message === "TOO_MANY_LOGIN_ATTEMPTS") {
      return "Too many failed sign-in attempts. Please try again in 15 minutes.";
    }
    return error.message || "Unable to sign in. Please try again.";
  }
  return "Unable to sign in. Please try again.";
}
