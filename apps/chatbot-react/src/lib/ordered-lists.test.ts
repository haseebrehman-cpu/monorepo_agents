import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MessageContent from "@/components/chat/MessageContent";
import { normalizeOrderedListNumbering } from "./ordered-lists";

const productList = [
  "Here are five boxing gloves available in our store:",
  "",
  "1. **RDX Boxing Gloves AS2**",
  "- **Price:** £62.99",
  "- **Availability:** In Stock",
  "- **URL:**",
  "",
  "1. **RDX F7 Ego Boxing Gloves**",
  "- **Price:** £36.99",
  "- **Availability:** In Stock",
  "- **URL:**",
  "",
  "1. **RDX 4B Robo Kids Boxing Gloves**",
  "- **Price:** £22.99, reduced from £25.99",
  "- **Availability:** In Stock",
  "- **URL:**",
  "",
  "If you need more information about any specific pair, feel free to ask!",
].join("\n");

describe("normalizeOrderedListNumbering", () => {
  it("renumbers repeated 1. items and nests the detail bullets", () => {
    expect(normalizeOrderedListNumbering(productList)).toBe(
      [
        "Here are five boxing gloves available in our store:",
        "",
        "1. **RDX Boxing Gloves AS2**",
        "   - **Price:** £62.99",
        "   - **Availability:** In Stock",
        "   - **URL:**",
        "",
        "2. **RDX F7 Ego Boxing Gloves**",
        "   - **Price:** £36.99",
        "   - **Availability:** In Stock",
        "   - **URL:**",
        "",
        "3. **RDX 4B Robo Kids Boxing Gloves**",
        "   - **Price:** £22.99, reduced from £25.99",
        "   - **Availability:** In Stock",
        "   - **URL:**",
        "",
        "If you need more information about any specific pair, feel free to ask!",
      ].join("\n"),
    );
  });

  it("restarts numbering after a paragraph", () => {
    const input = ["1. First", "1. Second", "", "Then:", "", "1. Again"].join(
      "\n",
    );
    expect(normalizeOrderedListNumbering(input)).toBe(
      ["1. First", "2. Second", "", "Then:", "", "1. Again"].join("\n"),
    );
  });

  it("leaves nested ordered items and code fences alone", () => {
    const input = ["1. Parent", "   1. Child", "```", "1. not a list", "```"].join(
      "\n",
    );
    expect(normalizeOrderedListNumbering(input)).toBe(input);
  });
});

describe("MessageContent ordered lists", () => {
  it("renders split product items as one incrementing list", () => {
    const html = renderToStaticMarkup(
      createElement(MessageContent, { content: productList }),
    );
    expect(html.match(/<ol[\s>]/g)).toHaveLength(1);
    expect(html).toContain("RDX Boxing Gloves AS2");
    expect(html).toContain("RDX F7 Ego Boxing Gloves");
    expect(html).toContain("RDX 4B Robo Kids Boxing Gloves");
  });
});
