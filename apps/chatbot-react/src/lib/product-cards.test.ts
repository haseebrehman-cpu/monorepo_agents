import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@rdx/chat-contract";
import {
  collectDisplayProducts,
  nonProductCitations,
  stripProductLinksFromAnswer,
} from "./product-cards";

const product = {
  title: "RDX WAKO SHIN GUARD T2 Blue",
  url: "https://rdxsports.co.uk/products/t2-wako-blue",
  handle: "t2-wako-blue",
  price_min: "41.99",
  price_max: "41.99",
  compare_at_min: null,
  compare_at_max: null,
  price_currency: "GBP",
  promotions: null,
  availability: "out_of_stock",
  stock_status: "Sold Out",
  image_url: null,
};

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "1",
    role: "assistant",
    content: "Here are some options.",
    ...overrides,
  };
}

describe("collectDisplayProducts", () => {
  it("promotes product citations and markdown links into cards", () => {
    const cards = collectDisplayProducts(
      message({
        products: [{ ...product, image_url: "https://rdxsports.co.uk/images/t2-wako-blue.jpg" }],
        citations: [
          {
            title: "RDX T15 Noir Black Shin Instep Guards",
            source_uri:
              "https://rdxsports.co.uk/products/t15-noir-black-shin-instep-guards",
          },
          {
            title: "Shipping policy",
            source_uri: "https://rdxsports.co.uk/policies/shipping-policy",
          },
        ],
        content:
          "See [RDX T6 Shin Instep Guards](https://rdxsports.co.uk/products/t6-shin-instep-guards).",
      }),
    );

    expect(cards.map((card) => card.handle)).toEqual([
      "t2-wako-blue",
      "t15-noir-black-shin-instep-guards",
      "t6-shin-instep-guards",
    ]);
    expect(cards[0]?.stock_status).toBe("Sold Out");
  });

  it("deduplicates the same product from products, citations, and markdown", () => {
    const cards = collectDisplayProducts(
      message({
        products: [{ ...product, image_url: "https://rdxsports.co.uk/images/t2-wako-blue.jpg" }],
        citations: [
          {
            title: product.title,
            url: product.url,
          },
        ],
        content: `[${product.title}](${product.url})`,
      }),
    );

    expect(cards).toHaveLength(1);
  });
});

describe("nonProductCitations", () => {
  it("keeps only non-product sources", () => {
    expect(
      nonProductCitations([
        {
          title: "Size guide",
          source_uri: "https://rdxsports.co.uk/pages/size-guide",
        },
        {
          title: product.title,
          source_uri: product.url,
        },
      ]),
    ).toHaveLength(1);
  });
});

describe("stripProductLinksFromAnswer", () => {
  it("removes product links and empty list markers", () => {
    expect(
      stripProductLinksFromAnswer(
        [
          "Here are shin guards:",
          "1. [RDX T2](https://rdxsports.co.uk/products/t2-wako)",
          "2. [RDX T6](https://rdxsports.co.uk/products/t6-shin)",
          "",
          "Need help with [returns](https://rdxsports.co.uk/policies/refund-policy)?",
        ].join("\n"),
      ),
    ).toBe(
      "Here are shin guards:\n\nNeed help with [returns](https://rdxsports.co.uk/policies/refund-policy)?",
    );
  });
});
