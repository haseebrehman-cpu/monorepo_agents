import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@rdx/chat-contract";
import {
  collectDisplayProducts,
  collectProductSizeCharts,
  isSizeChartQuery,
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

describe("isSizeChartQuery", () => {
  it("matches size chart phrasing and ignores other sizing questions", () => {
    expect(isSizeChartQuery("show me the size chart for T2")).toBe(true);
    expect(isSizeChartQuery("Size-charts for these gloves?")).toBe(true);
    expect(isSizeChartQuery("what size should I buy?")).toBe(false);
  });
});

describe("collectProductSizeCharts", () => {
  it("returns unique size charts from products that include one", () => {
    expect(
      collectProductSizeCharts([
        {
          ...product,
          size_chart: {
            url: "https://rdxsports.co.uk/cdn/shop/files/t2-size-chart.jpg",
            alt: "T2 size chart",
          },
        },
        {
          ...product,
          title: "RDX T6",
          handle: "t6",
          url: "https://rdxsports.co.uk/products/t6",
        },
        {
          ...product,
          title: "RDX T2 duplicate",
          handle: "t2-dup",
          size_chart: {
            url: "https://rdxsports.co.uk/cdn/shop/files/t2-size-chart.jpg",
            alt: "Same chart",
          },
        },
      ]),
    ).toEqual([
      {
        title: product.title,
        url: "https://rdxsports.co.uk/cdn/shop/files/t2-size-chart.jpg",
        alt: "T2 size chart",
      },
    ]);
  });

  it("falls back to a product title when alt is missing", () => {
    expect(
      collectProductSizeCharts([
        {
          ...product,
          size_chart: { url: "https://rdxsports.co.uk/cdn/shop/files/chart.png" },
        },
      ]),
    ).toEqual([
      {
        title: product.title,
        url: "https://rdxsports.co.uk/cdn/shop/files/chart.png",
        alt: `Size chart for ${product.title}`,
      },
    ]);
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

  it("keeps inline product links that share a line with other copy", () => {
    const answer = [
      "I couldn't find Nike boxing gloves in this store. However, here are some alternatives:",
      "",
      "1. **RDX Boxing Gloves AS2** — £62.99 — In Stock — [View Product](https://rdxsports.co.uk/products/boxing-gloves-as2)",
      "2. **RDX F7 Ego Boxing Gloves** — £36.99 — In Stock — [View Product](https://rdxsports.co.uk/products/ego-boxing-gloves)",
    ].join("\n");

    expect(stripProductLinksFromAnswer(answer)).toBe(answer);
  });

  it("keeps the address on a labeled URL field", () => {
    expect(
      stripProductLinksFromAnswer(
        [
          "1. **RDX R2 Weightlifting Grips**",
          "   - **Price:** £7.99, reduced from £10.99",
          "   - **Availability:** In Stock",
          "   - **URL:** [RDX R2 Weightlifting Grips](https://rdxsports.co.uk/products/r2-weightlifting-grips)",
          "",
          "2. **RDX T1 Weightlifting Grips**",
          "   - **Price:** £8.99",
          "   - **Availability:** In Stock",
          "   - **URL:** [RDX T1 Weightlifting Grips](https://rdxsports.co.uk/products/t1-weightlifting-grips)",
        ].join("\n"),
      ),
    ).toBe(
      [
        "1. **RDX R2 Weightlifting Grips**",
        " - **Price:** £7.99, reduced from £10.99",
        " - **Availability:** In Stock",
        " - **URL:** [https://rdxsports.co.uk/products/r2-weightlifting-grips](https://rdxsports.co.uk/products/r2-weightlifting-grips)",
        "",
        "2. **RDX T1 Weightlifting Grips**",
        " - **Price:** £8.99",
        " - **Availability:** In Stock",
        " - **URL:** [https://rdxsports.co.uk/products/t1-weightlifting-grips](https://rdxsports.co.uk/products/t1-weightlifting-grips)",
      ].join("\n"),
    );
  });
});
