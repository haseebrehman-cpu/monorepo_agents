import path from "node:path";
import * as XLSX from "xlsx";
import { MAX_BULK_TICKET_ROWS } from "./tickets.constants.js";
import { createTicketSchema, type CreateTicketInput } from "./tickets.schema.js";

export type BulkTicketRow = {
  rowNumber: number;
  input: CreateTicketInput;
  assignedDepartmentName?: string;
};

export type BulkTicketError = {
  row: number;
  field: string;
  message: string;
};

export class BulkTicketFileError extends Error {
  constructor(
    message: string,
    readonly details: BulkTicketError[] = []
  ) {
    super(message);
    this.name = "BulkTicketFileError";
  }
}

type BulkTicketColumn = keyof CreateTicketInput | "assignedDepartmentName";

const HEADER_ALIASES: Record<string, BulkTicketColumn> = {
  orderid: "orderId",
  ordernumber: "orderId",
  courier: "courier",
  trackingnumber: "trackingNumber",
  trackingno: "trackingNumber",
  issue: "issue",
  comment: "comment",
  description: "comment",
  assigneddepartmentid: "assignedDepartmentId",
  departmentid: "assignedDepartmentId",
  assigneddepartment: "assignedDepartmentName",
  assigneddepartmentname: "assignedDepartmentName",
  department: "assignedDepartmentName",
  departmentname: "assignedDepartmentName",
  status: "status",
};

const REQUIRED_FIELDS: Array<keyof CreateTicketInput> = [
  "orderId",
  "courier",
  "trackingNumber",
  "issue",
];

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function parseBulkTicketFile(fileName: string, buffer: Buffer): BulkTicketRow[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      raw: false,
      dense: true,
    });
  } catch {
    throw new BulkTicketFileError("INVALID_BULK_FILE");
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new BulkTicketFileError("EMPTY_BULK_FILE");
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  if (rows.length < 2) {
    throw new BulkTicketFileError("EMPTY_BULK_FILE");
  }

  const headers = rows[0].map((header) => HEADER_ALIASES[normalizeHeader(header)]);
  const missing = REQUIRED_FIELDS.filter((field) => !headers.includes(field));
  if (missing.length) {
    throw new BulkTicketFileError(
      "MISSING_BULK_COLUMNS",
      missing.map((field) => ({ row: 1, field, message: "Required column is missing" }))
    );
  }

  const dataRows = rows
    .slice(1)
    .map((cells, index) => ({ cells, rowNumber: index + 2 }))
    .filter(({ cells }) => cells.some((cell) => normalizeCell(cell) !== ""));

  if (!dataRows.length) {
    throw new BulkTicketFileError("EMPTY_BULK_FILE");
  }
  if (dataRows.length > MAX_BULK_TICKET_ROWS) {
    throw new BulkTicketFileError("TOO_MANY_BULK_ROWS", [
      {
        row: 1,
        field: "file",
        message: `A maximum of ${MAX_BULK_TICKET_ROWS} tickets can be uploaded at once`,
      },
    ]);
  }

  const parsedRows: BulkTicketRow[] = [];
  const errors: BulkTicketError[] = [];
  const seenOrderIds = new Map<string, number>();
  const seenTrackingNumbers = new Map<string, number>();

  for (const { cells, rowNumber } of dataRows) {
    const candidate: Record<string, unknown> = {};
    headers.forEach((field, index) => {
      if (field) candidate[field] = normalizeCell(cells[index]);
    });
    const assignedDepartmentName =
      normalizeCell(candidate.assignedDepartmentName) || undefined;
    delete candidate.assignedDepartmentName;

    const parsed = createTicketSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          row: rowNumber,
          field: String(issue.path[0] ?? "row"),
          message: issue.message,
        });
      }
      continue;
    }

    const orderKey = parsed.data.orderId.toLowerCase();
    const trackingKey = parsed.data.trackingNumber.toLowerCase();
    const originalOrderRow = seenOrderIds.get(orderKey);
    const originalTrackingRow = seenTrackingNumbers.get(trackingKey);
    if (originalOrderRow) {
      errors.push({
        row: rowNumber,
        field: "orderId",
        message: `Duplicate order ID in file (first appears on row ${originalOrderRow})`,
      });
    }
    if (originalTrackingRow) {
      errors.push({
        row: rowNumber,
        field: "trackingNumber",
        message: `Duplicate tracking number in file (first appears on row ${originalTrackingRow})`,
      });
    }
    if (originalOrderRow || originalTrackingRow) {
      continue;
    }
    seenOrderIds.set(orderKey, rowNumber);
    seenTrackingNumbers.set(trackingKey, rowNumber);
    parsedRows.push({
      rowNumber,
      input: parsed.data,
      ...(assignedDepartmentName ? { assignedDepartmentName } : {}),
    });
  }

  if (errors.length) {
    throw new BulkTicketFileError("BULK_VALIDATION_FAILED", errors);
  }

  // XLSX validates content while this prevents accidentally accepting renamed files.
  if (![".csv", ".xls", ".xlsx"].includes(path.extname(fileName).toLowerCase())) {
    throw new BulkTicketFileError("INVALID_BULK_FILE_TYPE");
  }

  return parsedRows;
}
