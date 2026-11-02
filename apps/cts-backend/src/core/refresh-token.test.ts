import { describe, expect, it } from "vitest";
import { createRefreshToken, hashRefreshToken } from "./refresh-token.js";

describe("refresh tokens", () => {
  it("creates a unique secret and a stable hash", () => {
    const token = createRefreshToken();
    expect(token.length).toBeGreaterThan(32);
    expect(createRefreshToken()).not.toBe(token);
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toBe(hashRefreshToken(`${token}x`));
  });
});
