import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({ env: { JWT_SECRET: "test-secret-that-is-long-enough-123" } }));

const { issueCustomerToken, verifyCustomerToken } = await import("./customer-token.js");
const { customerMessageSchema, customerSessionSchema, parseCursor } = await import("./customer.schema.js");
const { parseCustomerNotice } = await import("./live-chat.events.js");
const { customerFacingName } = await import("./live-chat.constants.js");

const conversationId = "a8c30f68-25d6-450a-8d57-51cf34381491";

describe("customer token", () => {
  it("round-trips the conversation id", () => {
    expect(verifyCustomerToken(issueCustomerToken(conversationId))).toBe(conversationId);
  });

  it("rejects a token signed with the staff session secret", () => {
    const staffSigned = jwt.sign({}, "test-secret-that-is-long-enough-123", {
      algorithm: "HS256",
      audience: "live-chat-customer",
      subject: conversationId,
    });
    expect(verifyCustomerToken(staffSigned)).toBeNull();
  });

  it("rejects tampered and expired tokens", () => {
    const token = issueCustomerToken(conversationId);
    expect(verifyCustomerToken(`${token}x`)).toBeNull();

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    expect(verifyCustomerToken(token)).toBeNull();
    vi.useRealTimers();
  });
});

describe("customerMessageSchema", () => {
  it("normalises the body and defaults the client id", () => {
    expect(customerMessageSchema.parse({ body: "  hi\r\nthere\u0007 " })).toEqual({
      body: "hi\nthere",
      clientId: null,
    });
  });

  it("rejects empty bodies and odd client ids", () => {
    expect(customerMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(customerMessageSchema.safeParse({ body: "hi", clientId: "has space!" }).success).toBe(false);
  });
});

describe("customerSessionSchema", () => {
  it("accepts the desk conversation id", () => {
    expect(customerSessionSchema.parse({ handoffId: `  ${conversationId}  ` })).toEqual({
      handoffId: conversationId,
    });
    expect(customerSessionSchema.safeParse({ handoffId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("parseCursor", () => {
  it("accepts message ids only", () => {
    expect(parseCursor("42")).toBe("42");
    expect(parseCursor("42; DROP")).toBeNull();
    expect(parseCursor(undefined)).toBeNull();
  });
});

describe("parseCustomerNotice", () => {
  it("reads the compact payload", () => {
    expect(parseCustomerNotice(JSON.stringify({ c: conversationId, m: ["7"], s: true }))).toEqual({
      conversationId,
      messageIds: ["7"],
      status: true,
    });
  });

  it("drops malformed payloads", () => {
    expect(parseCustomerNotice("nope")).toBeNull();
    expect(parseCustomerNotice(JSON.stringify({ c: conversationId, m: [7] }))).toBeNull();
  });

  it("reads a typing signal", () => {
    expect(parseCustomerNotice(JSON.stringify({ c: conversationId, m: [], s: false, t: true }))?.typing).toBe(
      true,
    );
  });
});

describe("customerFacingName", () => {
  it("uses the first name", () => {
    expect(customerFacingName("  Sarah   Chen ")).toBe("Sarah");
    expect(customerFacingName("")).toBe("Our team");
  });
});
