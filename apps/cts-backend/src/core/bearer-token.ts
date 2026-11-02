import { createHash, timingSafeEqual } from "node:crypto";

const BEARER = /^Bearer\s+(\S+)\s*$/i;

export function readBearerToken(authorization: string | string[] | undefined): string | null {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) return null;
  const match = BEARER.exec(header.trim());
  return match?.[1] ?? null;
}

export function serviceTokensMatch(presented: string, expected: string): boolean {
  if (!expected) return false;
  const left = createHash("sha256").update(presented).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}
