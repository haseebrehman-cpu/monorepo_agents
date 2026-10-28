import { describe, expect, it } from "vitest";
import { createResendSchema, listResendsQuerySchema } from "./resends.schema.js";

const validResend = {
  referenceNo: "REF-1",
  type: "Full",
  salesChannel: "Shopify",
  sku: "SKU-1",
  title: "Lamp",
  quantity: "2",
  salePrice: "28.99 EUR",
  shippingCost: "4.5",
  country: "United Kingdom",
  reason: "Damaged",
  tags: "Priority",
  accountable: "Warehouse",
  itemReturned: "No",
  buyerComment: "Box was crushed",
  comment: "Send a replacement",
  issueListing: "false",
  issueWarehouse: "true",
  issueLogistics: "false",
  issueFactory: "false",
};

describe("listResendsQuerySchema", () => {
  it("applies safe pagination and sorting defaults", () => {
    const result = listResendsQuerySchema.parse({});

    expect(result).toMatchObject({
      page: 0,
      pageSize: 25,
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  });

  it("rejects page sizes above the maximum", () => {
    expect(() => listResendsQuerySchema.parse({ pageSize: "101" })).toThrow();
  });

  it("rejects refund-only sort fields", () => {
    expect(() => listResendsQuerySchema.parse({ sortBy: "refundPrice" })).toThrow();
  });
});

describe("createResendSchema", () => {
  it("parses multipart resend fields", () => {
    const result = createResendSchema.parse(validResend);

    expect(result).toMatchObject({
      referenceNo: "REF-1",
      quantity: 2,
      salePrice: "28.99 EUR",
      shippingCost: 4.5,
      issueWarehouse: true,
      issueListing: false,
      email: "",
      courierService: "",
    });
  });

  it("rejects a missing comment", () => {
    expect(() => createResendSchema.parse({ ...validResend, comment: " " })).toThrow();
  });
});
