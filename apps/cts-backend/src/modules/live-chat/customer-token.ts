import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { JWT_ALGORITHM } from "../../core/auth-session.js";
import { CUSTOMER_TOKEN_TTL_SECONDS } from "./live-chat.constants.js";

const AUDIENCE = "live-chat-customer";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Derived so a customer token can never verify as a staff session, and the reverse. */
const signingKey = createHmac("sha256", env.JWT_SECRET).update(AUDIENCE).digest();

/** Lets the customer read and write one desk conversation, and nothing else. */
export function issueCustomerToken(conversationId: string) {
  return jwt.sign({}, signingKey, {
    algorithm: JWT_ALGORITHM,
    audience: AUDIENCE,
    subject: conversationId,
    expiresIn: CUSTOMER_TOKEN_TTL_SECONDS,
  });
}

/** The conversation id the token grants, or null when it is invalid or expired. */
export function verifyCustomerToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, signingKey, {
      algorithms: [JWT_ALGORITHM],
      audience: AUDIENCE,
    });
    if (typeof payload !== "object" || typeof payload.sub !== "string") return null;
    return UUID.test(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}
