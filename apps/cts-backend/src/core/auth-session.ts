import type { CookieOptions, Request } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE_NAME = "cts_session";
export const JWT_ALGORITHM = "HS256" as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production" || env.COOKIE_SAME_SITE === "none",
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: DAY_IN_MS,
  path: "/",
};

export const clearSessionCookieOptions: CookieOptions = {
  httpOnly: sessionCookieOptions.httpOnly,
  secure: sessionCookieOptions.secure,
  sameSite: sessionCookieOptions.sameSite,
  path: sessionCookieOptions.path,
};

export function readSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}
