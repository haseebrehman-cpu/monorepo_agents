import { describe, expect, it } from "vitest";
import { createHandoffSchema } from "./handoffs.schema.js";

const validHandoff = {
  conversationId: "a1b2c3d4e5f6",
  customerName: "Xian Chen",
  customerEmail: "Sarah.Chen@Example.com",
  handoffReason: "Customer asked for a person.",
  aiSummary: "Order IG-10482 is stuck in transit.",
};

describe("createHandoffSchema", () => {
  it("applies defaults and normalises the customer", () => {
    const result = createHandoffSchema.parse(validHandoff);

    expect(result).toMatchObject({
      customerEmail: "sarah.chen@example.com",
      channel: "Website chat",
      orderNumber: null,
      location: "",
      tags: [],
    });
  });

  it("treats null optional fields from the chatbot as missing", () => {
    const result = createHandoffSchema.parse({
      ...validHandoff,
      channel: null,
      orderNumber: null,
      tags: null,
    });

    expect(result).toMatchObject({ channel: "Website chat", tags: [] });
  });

  it("strips control characters and line breaks from single-line fields", () => {
    const result = createHandoffSchema.parse({
      ...validHandoff,
      customerName: "Xian\r\nChen\u0000",
      handoffReason: "Line one\r\nLine two\u0007",
    });

    expect(result.customerName).toBe("Xian Chen");
    expect(result.handoffReason).toBe("Line one\nLine two");
  });

  it("deduplicates tags and drops fields this request no longer accepts", () => {
    const result = createHandoffSchema.parse({
      ...validHandoff,
      tags: ["Shipping", "shipping", "priority"],
      currentPage: "/orders/IG-10482",
      visits: 4,
      browser: "Chrome on macOS",
      referrer: "Order confirmation email",
      messages: [{ author: "customer", body: "I need a person.", at: "2026-11-03T10:04:00Z" }],
      status: "active",
    });

    expect(result.tags).toEqual(["shipping", "priority"]);
    expect(result).not.toHaveProperty("currentPage");
    expect(result).not.toHaveProperty("visits");
    expect(result).not.toHaveProperty("browser");
    expect(result).not.toHaveProperty("referrer");
    expect(result).not.toHaveProperty("messages");
    expect(result).not.toHaveProperty("status");
  });

  it.each([
    ["an invalid conversation id", { conversationId: "../etc/passwd" }],
    ["an invalid email", { customerEmail: "not-an-email" }],
    ["a blank name", { customerName: "   " }],
    ["a tag with markup", { tags: ["<script>"] }],
    ["an oversized summary", { aiSummary: "x".repeat(4_001) }],
  ])("rejects %s", (_label, override) => {
    expect(createHandoffSchema.safeParse({ ...validHandoff, ...override }).success).toBe(false);
  });
});
