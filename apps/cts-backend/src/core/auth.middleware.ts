import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ROLE } from "../config/features.js";
import { env } from "../config/env.js";
import { loadUserAccess } from "./access.js";
import { readSessionToken } from "./auth-session.js";

export type AuthUser = {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = readSessionToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: "NO_TOKEN" });
  }

  let payload: { userId: number; email: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as any;
  } catch {
    return res.status(401).json({ success: false, error: "INVALID_TOKEN" });
  }

  try {
    const access = await loadUserAccess(payload.userId);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      roles: access.roles,
      permissions: access.permissions,
    };
  } catch (error) {
    console.error("[authenticate] failed to load user access:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
  }

  next();
}

export function requirePermission(...codes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
    }
    if (req.user.roles.includes(ROLE.ADMIN)) {
      return next();
    }
    const has = codes.some((code) => req.user!.permissions.includes(code));
    if (!has) {
      return res
        .status(403)
        .json({ success: false, error: "FORBIDDEN", required: codes });
    }
    next();
  };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
  }
  if (!req.user.roles.includes(ROLE.ADMIN)) {
    return res.status(403).json({ success: false, error: "ADMIN_ONLY" });
  }
  next();
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "UNAUTHENTICATED" });
  }
  if (!req.user.roles.includes(ROLE.SUPER_ADMIN)) {
    return res.status(403).json({ success: false, error: "SUPER_ADMIN_ONLY" });
  }
  next();
}
