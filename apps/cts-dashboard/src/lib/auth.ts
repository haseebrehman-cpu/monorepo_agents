import { ApiError } from "@rdx/api-client";
import { createCtsApi, ctsApi } from "./api";
import {
  getHomePath as homePathForUser,
  isAdminUser as hasAdminRole,
  isSuperAdminUser as hasSuperAdminRole,
} from "./permissions";

const TOKEN_KEY = "cts_token";
const USER_KEY = "cts_user";

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
    token: string;
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

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAdminUser(user = getAuthUser()): boolean {
  return hasAdminRole(user);
}

export function isSuperAdminUser(user = getAuthUser()): boolean {
  return hasSuperAdminRole(user);
}

export function getHomePath(user = getAuthUser()): string {
  return homePathForUser(user);
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authedApi() {
  return createCtsApi(getToken());
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
