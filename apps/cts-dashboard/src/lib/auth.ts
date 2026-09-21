import { ApiError } from "@rdx/api-client";
import { createCtsApi, ctsApi } from "./api";
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

export function authedApi() {
  const api = createCtsApi();
  const fetchRequest = api.fetch;

  return createCtsApi(async (input, init) => {
    const response = await fetchRequest(input, init);
    if (response.status === 401) {
      handleUnauthorized();
    }
    return response;
  });
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
    return error.message || "Unable to sign in. Please try again.";
  }
  return "Unable to sign in. Please try again.";
}
