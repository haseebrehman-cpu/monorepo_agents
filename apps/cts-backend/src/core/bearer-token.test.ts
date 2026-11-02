import { describe, expect, it } from "vitest";
import { readBearerToken, serviceTokensMatch } from "./bearer-token.js";

describe("readBearerToken", () => {
  it("reads a bearer token", () => {
    expect(readBearerToken("Bearer secret-token")).toBe("secret-token");
    expect(readBearerToken("bearer secret-token")).toBe("secret-token");
  });

  it("rejects missing or non-bearer credentials", () => {
    expect(readBearerToken(undefined)).toBeNull();
    expect(readBearerToken("")).toBeNull();
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken("Bearer")).toBeNull();
    expect(readBearerToken("Bearer one two")).toBeNull();
  });
});

describe("serviceTokensMatch", () => {
  it("matches the configured token and rejects anything else", () => {
    expect(serviceTokensMatch("correct-token", "correct-token")).toBe(true);
    expect(serviceTokensMatch("wrong-token", "correct-token")).toBe(false);
    expect(serviceTokensMatch("correct-token", "")).toBe(false);
    expect(serviceTokensMatch("short", "correct-token")).toBe(false);
  });
});
