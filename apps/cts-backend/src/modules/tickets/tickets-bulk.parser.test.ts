import { describe, expect, it } from "vitest";
import {
  BulkTicketFileError,
  parseBulkTicketFile,
} from "./tickets-bulk.parser.js";

function csv(contents: string) {
  return Buffer.from(contents, "utf8");
}

describe("parseBulkTicketFile", () => {
  it("parses and normalizes valid CSV rows", () => {
    const rows = parseBulkTicketFile(
      "tickets.csv",
      csv(
        [
          "Order ID,Courier,Tracking Number,Issue,Comment,Assigned Department ID,Status",
          "ORDER-1,DHL,TRACK-1,Delayed,Please check,2,Open",
        ].join("\n")
      )
    );

    expect(rows).toEqual([
      {
        rowNumber: 2,
        input: {
          orderId: "ORDER-1",
          courier: "DHL",
          trackingNumber: "TRACK-1",
          issue: "Delayed",
          comment: "Please check",
          assignedDepartmentId: 2,
          status: "Open",
        },
      },
    ]);
  });

  it("defaults a missing status to Not Started", () => {
    const rows = parseBulkTicketFile(
      "tickets.csv",
      csv("Order ID,Courier,Tracking Number,Issue\nORDER-1,DHL,TRACK-1,Delayed")
    );

    expect(rows[0].input.status).toBe("Not Started");
  });

  it("reads an assigned department name", () => {
    const rows = parseBulkTicketFile(
      "tickets.csv",
      csv(
        [
          "Order ID,Courier,Tracking Number,Issue,Assigned Department",
          "ORDER-1,DHL,TRACK-1,Delayed,Customer Support",
        ].join("\n")
      )
    );

    expect(rows[0].assignedDepartmentName).toBe("Customer Support");
    expect(rows[0].input.assignedDepartmentId).toBeNull();
  });

  it("reports missing required columns", () => {
    try {
      parseBulkTicketFile("tickets.csv", csv("Order ID,Courier\nORDER-1,DHL"))
      expect.fail("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BulkTicketFileError);
      expect(error).toMatchObject({
        message: "MISSING_BULK_COLUMNS",
      });
    }
  });

  it("reports the spreadsheet row for invalid data", () => {
    try {
      parseBulkTicketFile(
        "tickets.csv",
        csv("Order ID,Courier,Tracking Number,Issue\n,DHL,TRACK-1,Delayed")
      );
      expect.fail("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BulkTicketFileError);
      expect((error as BulkTicketFileError).details[0]).toMatchObject({
        row: 2,
        field: "orderId",
      });
    }
  });

  it("rejects duplicate order IDs and tracking numbers independently", () => {
    try {
      parseBulkTicketFile(
        "tickets.csv",
        csv(
          [
            "Order ID,Courier,Tracking Number,Issue",
            "ORDER-1,DHL,TRACK-1,Delayed",
            "order-1,DHL,TRACK-2,Delayed",
            "ORDER-2,DHL,track-1,Delayed",
          ].join("\n")
        )
      );
      expect.fail("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(BulkTicketFileError);
      expect((error as BulkTicketFileError).details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ row: 3, field: "orderId" }),
          expect.objectContaining({ row: 4, field: "trackingNumber" }),
        ])
      );
    }
  });
});
