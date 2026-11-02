import type { CookieOptions, Request } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE_NAME = "cts_session";
export const REFRESH_COOKIE_NAME = "cts_refresh";
export const JWT_ALGORITHM = "HS256" as const;

export const SESSION_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: number;
  email: string;
  sv?: number;
};

export function isSessionPayload(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    Number.isInteger(payload.userId) &&
    (payload.userId as number) > 0 &&
    typeof payload.email === "string" &&
    (payload.sv === undefined || Number.isInteger(payload.sv))
  );
}

const cookieBase: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" || env.COOKIE_SAME_SITE === "none",
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
};

export const sessionCookieOptions: CookieOptions = {
  ...cookieBase,
  maxAge: SESSION_TTL_MS,
};

export const refreshCookieOptions: CookieOptions = {
  ...cookieBase,
  maxAge: REFRESH_TTL_MS,
};

export const clearSessionCookieOptions: CookieOptions = {
  httpOnly: cookieBase.httpOnly,
  secure: cookieBase.secure,
  sameSite: cookieBase.sameSite,
  path: cookieBase.path,
};

export function readCookie(req: Request, cookieName: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== cookieName) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}

export function readSessionToken(req: Request): string | null {
  return readCookie(req, SESSION_COOKIE_NAME);
}
