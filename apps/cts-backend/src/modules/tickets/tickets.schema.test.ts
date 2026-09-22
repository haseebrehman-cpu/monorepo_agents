import { describe, expect, it } from "vitest";
import { listTicketsQuerySchema } from "./tickets.schema.js";

describe("listTicketsQuerySchema", () => {
  it("applies safe pagination and sorting defaults", () => {
    const result = listTicketsQuerySchema.parse({});

    expect(result).toMatchObject({
      page: 0,
      pageSize: 25,
      sortBy: "ticketDate",
      sortDirection: "desc",
    });
  });

  it("parses valid pagination and sorting query strings", () => {
    const result = listTicketsQuerySchema.parse({
      page: "2",
      pageSize: "50",
      sortBy: "status",
      sortDirection: "asc",
    });

    expect(result).toMatchObject({
      page: 2,
      pageSize: 50,
      sortBy: "status",
      sortDirection: "asc",
    });
  });

  it("rejects page sizes above the maximum", () => {
    expect(() =>
      listTicketsQuerySchema.parse({ pageSize: "101" })
    ).toThrow();
  });
});
