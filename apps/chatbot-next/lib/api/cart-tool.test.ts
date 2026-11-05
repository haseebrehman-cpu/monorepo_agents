import { describe, expect, it } from "vitest";
import { toolMutatedCart } from "./cart-tool";

describe("toolMutatedCart", () => {
  it("is true only when a cart tool succeeds", () => {
    expect(toolMutatedCart("add_to_cart", "ok")).toBe(true);
    expect(toolMutatedCart("update_cart_item", "ok")).toBe(true);
    expect(toolMutatedCart("empty_bag", "ok")).toBe(true);
  });

  it("ignores product search, failed cart tools, and cart reads", () => {
    expect(toolMutatedCart("search_products", "ok")).toBe(false);
    expect(toolMutatedCart("add_to_cart", "failed")).toBe(false);
    expect(toolMutatedCart("get_cart", "ok")).toBe(false);
    expect(toolMutatedCart("view_bag", "ok")).toBe(false);
  });
});
