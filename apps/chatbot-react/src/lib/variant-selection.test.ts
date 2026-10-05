import { describe, expect, it } from "vitest";
import type { ProductSelectorOption, ProductVariant } from "@rdx/chat-contract";
import {
  candidatesFor,
  initialSelection,
  isSelectionComplete,
  matchedVariant,
  missingOptions,
  optionValueState,
  orderedOptions,
  previewImageUrl,
  priceRange,
  selectedSizeColorLabel,
  selectValue,
} from "./variant-selection";

const options: ProductSelectorOption[] = [
  { key: "size", label: "Size", position: 2, values: ["12oz", "14oz"] },
  { key: "colour", label: "Color", position: 1, values: ["Black", "Blue"] },
];

const variants: ProductVariant[] = [
  {
    listing_id: "lst_black_12",
    options: { colour: "Black", size: "12oz" },
    price: "29.99",
    compare_at_price: null,
    available: true,
    purchasable: true,
    image_url: "https://rdxsports.co.uk/images/black.jpg",
  },
  {
    listing_id: "lst_black_14",
    options: { colour: "Black", size: "14oz" },
    price: "31.99",
    compare_at_price: "34.99",
    available: false,
    purchasable: false,
    image_url: "https://rdxsports.co.uk/images/black.jpg",
  },
  {
    listing_id: "lst_blue_12",
    options: { colour: "Blue", size: "12oz" },
    price: "29.99",
    compare_at_price: null,
    available: true,
    purchasable: true,
    image_url: "https://rdxsports.co.uk/images/blue.jpg",
  },
];

describe("orderedOptions", () => {
  it("renders option types in the store's position order", () => {
    expect(orderedOptions(options).map((option) => option.key)).toEqual([
      "colour",
      "size",
    ]);
  });

  it("treats missing options as none", () => {
    expect(orderedOptions(null)).toEqual([]);
  });
});

describe("initialSelection", () => {
  it("preselects the values of the card's default variant", () => {
    expect(initialSelection(variants, "lst_blue_12")).toEqual({
      colour: "Blue",
      size: "12oz",
    });
  });

  it("selects nothing when the default variant is not listed", () => {
    expect(initialSelection(variants, "lst_unknown")).toEqual({});
    expect(initialSelection(variants, null)).toEqual({});
  });
});

describe("optionValueState", () => {
  it("marks a combination that does not exist as missing", () => {
    expect(
      optionValueState(variants, { colour: "Blue" }, "size", "14oz"),
    ).toBe("missing");
  });

  it("marks a combination with no purchasable variant as sold out", () => {
    expect(
      optionValueState(variants, { colour: "Black" }, "size", "14oz"),
    ).toBe("sold_out");
  });

  it("enables a value that has a purchasable variant", () => {
    expect(
      optionValueState(variants, { colour: "Black" }, "size", "12oz"),
    ).toBe("available");
  });

  it("ignores the option's own current pick when judging its values", () => {
    expect(
      optionValueState(
        variants,
        { colour: "Black", size: "12oz" },
        "colour",
        "Blue",
      ),
    ).toBe("available");
  });
});

describe("candidatesFor", () => {
  it("keeps only variants matching the other picks", () => {
    expect(
      candidatesFor(variants, { colour: "Black" }, "size", "12oz").map(
        (variant) => variant.listing_id,
      ),
    ).toEqual(["lst_black_12"]);
  });
});

describe("selectValue", () => {
  it("drops an earlier pick the new one rules out", () => {
    expect(
      selectValue(
        options,
        variants,
        { colour: "Black", size: "14oz" },
        "colour",
        "Blue",
      ),
    ).toEqual({ colour: "Blue" });
  });

  it("keeps a compatible pick", () => {
    expect(
      selectValue(
        options,
        variants,
        { colour: "Black", size: "12oz" },
        "colour",
        "Blue",
      ),
    ).toEqual({ colour: "Blue", size: "12oz" });
  });
});

describe("matchedVariant", () => {
  it("resolves the one variant once every option is picked", () => {
    expect(
      matchedVariant(options, variants, { colour: "Black", size: "14oz" })
        ?.listing_id,
    ).toBe("lst_black_14");
  });

  it("has no match while a selection is incomplete", () => {
    expect(matchedVariant(options, variants, { colour: "Black" })).toBeNull();
    expect(isSelectionComplete(options, { colour: "Black" })).toBe(false);
    expect(missingOptions(options, { colour: "Black" })[0]?.label).toBe("Size");
  });

  it("uses the lone variant of a single-variant product", () => {
    expect(matchedVariant([], [variants[0]], {})?.listing_id).toBe(
      "lst_black_12",
    );
    expect(matchedVariant([], [], {})).toBeNull();
  });
});

describe("previewImageUrl", () => {
  it("uses the matched variant image when every option is picked", () => {
    expect(
      previewImageUrl(variants, { colour: "Blue", size: "12oz" }),
    ).toBe("https://rdxsports.co.uk/images/blue.jpg");
  });

  it("uses a colour match before size is picked", () => {
    expect(previewImageUrl(variants, { colour: "Blue" })).toBe(
      "https://rdxsports.co.uk/images/blue.jpg",
    );
  });

  it("has no preview until the shopper has a pick", () => {
    expect(previewImageUrl(variants, {})).toBeNull();
  });
});

describe("selectedSizeColorLabel", () => {
  it("joins colour then size for the card row", () => {
    expect(selectedSizeColorLabel({ colour: "Black", size: "12oz" })).toBe(
      "Black · 12oz",
    );
  });

  it("accepts the American spelling of color", () => {
    expect(selectedSizeColorLabel({ color: "Red", size: "M" })).toBe("Red · M");
  });

  it("shows whichever of size or colour is already picked", () => {
    expect(selectedSizeColorLabel({ colour: "Blue" })).toBe("Blue");
    expect(selectedSizeColorLabel({ size: "14oz" })).toBe("14oz");
    expect(selectedSizeColorLabel({})).toBe("");
  });
});

describe("priceRange", () => {
  it("spans the lowest and highest live price", () => {
    expect(priceRange(variants)).toEqual({ min: "29.99", max: "31.99" });
  });

  it("reports no range when no price was read live", () => {
    expect(
      priceRange([{ ...variants[0], price: null }]),
    ).toEqual({ min: null, max: null });
  });
});
