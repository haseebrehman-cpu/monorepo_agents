import { describe, expect, it } from "vitest";
import type { SupportProduct } from "@rdx/chat-contract";
import { cartVariants, defaultVariant, variantLabel } from "./variants";

const product = {
  product_id: "8662851649846",
  title: "RDX S5",
  url: "https://rdxsports.co.uk/products/s5",
  price_from: 12.99,
  currency: "GBP",
  available: true,
  image_url: null,
  variants: [
    { variant_id: "not-a-variant", available: true },
    { variant_id: "111", size: "16oz", colour: "Black", available: false },
    { variant_id: "222", size: "12oz", colour: "Red", available: true },
  ],
} satisfies SupportProduct;

describe("cart variants", () => {
  it("keeps only digit variant ids and prefers one that is for sale", () => {
    expect(cartVariants(product).map((variant) => variant.variant_id)).toEqual(["111", "222"]);
    expect(defaultVariant(product)?.variant_id).toBe("222");
  });

  it("labels a variant by size and colour", () => {
    expect(variantLabel({ variant_id: "222", size: "12oz", colour: "Red" })).toBe("12oz / Red");
    expect(variantLabel({ variant_id: "222" })).toBe("One size");
  });

  it("keeps fill and height from the title when size is empty", () => {
    expect(
      variantLabel({
        variant_id: "47326850646326",
        title: "Black / Filled / 5 FT",
        size: "",
        colour: "Black",
      }),
    ).toBe("Black / Filled / 5 FT");
  });
});
