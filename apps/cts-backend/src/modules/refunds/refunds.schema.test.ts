import { describe, expect, it } from "vitest";
import { createRefundSchema, listRefundsQuerySchema } from "./refunds.schema.js";

const validRefund = {
  referenceNo: "REF-1",
  type: "Full",
  salesChannel: "Shopify",
  sku: "SKU-1",
  title: "Lamp",
  quantity: "2",
  salePrice: "28.99 EUR",
  refundCurrency: "GBP",
  refundPrice: "10",
  shippingCost: "0",
  country: "United Kingdom",
  reason: "Damaged",
  tags: "Priority",
  accountable: "Warehouse",
  itemReturned: "Yes",
  buyerComment: "Box was crushed",
  comment: "Approved",
  issueListing: "false",
  issueWarehouse: "true",
  issueLogistics: "false",
  issueFactory: "false",
};

describe("listRefundsQuerySchema", () => {
  it("applies safe pagination and sorting defaults", () => {
    const result = listRefundsQuerySchema.parse({});

    expect(result).toMatchObject({
      page: 0,
      pageSize: 25,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  });

  it("rejects page sizes above the maximum", () => {
    expect(() => listRefundsQuerySchema.parse({ pageSize: "101" })).toThrow();
  });
});

describe("createRefundSchema", () => {
  it("parses multipart refund fields", () => {
    const result = createRefundSchema.parse(validRefund);

    expect(result).toMatchObject({
      referenceNo: "REF-1",
      quantity: 2,
      salePrice: "28.99 EUR",
      issueWarehouse: true,
      issueListing: false,
      email: "",
      courierService: "",
    });
  });

  it("rejects a missing reason", () => {
    expect(() => createRefundSchema.parse({ ...validRefund, reason: " " })).toThrow();
  });
});
