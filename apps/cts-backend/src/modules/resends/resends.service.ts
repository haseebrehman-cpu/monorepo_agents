import { pool } from "../../core/db.js";
import { canonicalCountry, listCountries } from "../refunds/countries.js";
import { ITEM_RETURNED_OPTIONS, canonicalItemReturned } from "../refunds/refunds.constants.js";
import { resendLookupsService } from "./resend-lookups.service.js";
import type { CreateResendInput, ResendListFilters } from "./resends.schema.js";

export type ResendAttachmentInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  fileData: Buffer;
};

const RESEND_SELECT = `
  SELECT
    r.id,
    r.resend_number,
    r.reference_no,
    r.order_id,
    r.category_name,
    r.email,
    r.type,
    r.sales_channel,
    r.sku,
    r.title,
    r.quantity,
    r.sale_price,
    r.shipping_cost,
    r.country,
    r.courier_service,
    r.tracking_number,
    r.reason,
    r.tags,
    r.accountable,
    r.item_returned,
    r.buyer_comment,
    r.comment,
    r.issue_listing,
    r.issue_warehouse,
    r.issue_logistics,
    r.issue_factory,
    r.created_at,
    COALESCE(
      (
        SELECT string_agg(a.file_name, ', ' ORDER BY a.id)
        FROM resend_attachments a
        WHERE a.resend_id = r.id
      ),
      ''
    ) AS attachment,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', a.id,
            'fileName', a.file_name,
            'mimeType', a.mime_type,
            'sizeBytes', a.size_bytes
          )
          ORDER BY a.id
        )
        FROM resend_attachments a
        WHERE a.resend_id = r.id
      ),
      '[]'
    ) AS attachments
  FROM resends r
`;

function money(value: unknown) {
  return Number(value).toFixed(2);
}

function yesNo(value: unknown) {
  return value === true ? "Yes" : "No";
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapResend(row: Record<string, unknown>) {
  return {
    id: row.resend_number as string,
    dbId: row.id as number,
    category: "Resend",
    referenceNo: row.reference_no as string,
    orderId: row.order_id as string,
    categoryName: row.category_name as string,
    email: row.email as string,
    type: row.type as string,
    salesChannel: row.sales_channel as string,
    sku: row.sku as string,
    title: row.title as string,
    quantity: String(row.quantity),
    salePrice: String(row.sale_price ?? ""),
    shippingCost: money(row.shipping_cost),
    country: row.country as string,
    courierService: row.courier_service as string,
    trackingNumber: row.tracking_number as string,
    reason: row.reason as string,
    tags: row.tags as string,
    accountable: row.accountable as string,
    itemReturned: row.item_returned as string,
    buyerComment: row.buyer_comment as string,
    comment: row.comment as string,
    attachment: (row.attachment as string) ?? "",
    attachments: parseJsonArray(row.attachments),
    issueListing: yesNo(row.issue_listing),
    issueWarehouse: yesNo(row.issue_warehouse),
    issueLogistics: yesNo(row.issue_logistics),
    issueFactory: yesNo(row.issue_factory),
    createdAt: row.created_at,
  };
}

async function resolveChoices(input: CreateResendInput) {
  const [type, salesChannel, reason, tags, accountable] = await Promise.all([
    resendLookupsService.assertActive("type", input.type),
    resendLookupsService.assertActive("sales_channel", input.salesChannel),
    resendLookupsService.assertActive("reason", input.reason),
    resendLookupsService.assertActive("tag", input.tags),
    resendLookupsService.assertActive("accountable", input.accountable),
  ]);

  return {
    type,
    salesChannel,
    country: canonicalCountry(input.country),
    courierService: input.courierService.trim(),
    reason,
    tags,
    accountable,
    itemReturned: canonicalItemReturned(input.itemReturned),
  };
}

// Numeric refs are database ids; longer digit strings would overflow INTEGER, so treat them as resend numbers.
function isResendNumber(ref: string) {
  return !/^\d{1,9}$/.test(ref);
}

function buildListQuery(filters: ResendListFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  const addEquals = (column: string, value: string | undefined) => {
    if (!value) return;
    values.push(value);
    conditions.push(`${column} = $${values.length}`);
  };

  addEquals("r.type", filters.type);
  addEquals("r.sales_channel", filters.salesChannel);
  addEquals("r.country", filters.country);
  addEquals("r.courier_service", filters.courierService);
  addEquals("r.reason", filters.reason);
  addEquals("r.tags", filters.tags);
  addEquals("r.accountable", filters.accountable);
  addEquals("r.item_returned", filters.itemReturned);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortColumns: Record<ResendListFilters["sortBy"], string> = {
    createdAt: "r.created_at",
    referenceNo: "r.reference_no",
    orderId: "r.order_id",
    categoryName: "r.category_name",
    email: "r.email",
    type: "r.type",
    salesChannel: "r.sales_channel",
    sku: "r.sku",
    title: "r.title",
    quantity: "r.quantity",
    salePrice: "r.sale_price",
    shippingCost: "r.shipping_cost",
    country: "r.country",
    courierService: "r.courier_service",
    trackingNumber: "r.tracking_number",
    reason: "r.reason",
    tags: "r.tags",
    accountable: "r.accountable",
    itemReturned: "r.item_returned",
  };
  const direction = filters.sortDirection === "asc" ? "ASC" : "DESC";
  const pageSize = filters.pageSize ?? 25;
  const page = filters.page ?? 0;
  values.push(pageSize, page * pageSize);

  return {
    sql: `${RESEND_SELECT} ${where}
      ORDER BY ${sortColumns[filters.sortBy ?? "createdAt"]} ${direction}, r.id ${direction}
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
    countSql: `SELECT COUNT(*)::integer AS total FROM resends r ${where}`,
    values,
    countValues: values.slice(0, -2),
    page,
    pageSize,
  };
}

async function insertAttachments(
  client: { query: typeof pool.query },
  resendId: number,
  attachments: ResendAttachmentInput[]
) {
  for (const file of attachments) {
    await client.query(
      `INSERT INTO resend_attachments (resend_id, file_name, mime_type, size_bytes, file_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [resendId, file.fileName, file.mimeType, file.sizeBytes, file.fileData]
    );
  }
}

export const resendsService = {
  async options() {
    const lookups = await resendLookupsService.listActiveByKind();
    return {
      types: lookups.type,
      salesChannels: lookups.sales_channel,
      countries: listCountries(),
      reasons: lookups.reason,
      tags: lookups.tag,
      accountables: lookups.accountable,
      itemReturned: [...ITEM_RETURNED_OPTIONS],
    };
  },

  async list(filters: ResendListFilters) {
    const { sql, countSql, values, countValues, page, pageSize } = buildListQuery(filters);
    const [countResult, { rows }] = await Promise.all([
      pool.query(countSql, countValues),
      pool.query(sql, values),
    ]);
    return {
      items: rows.map(mapResend),
      total: Number(countResult.rows[0]?.total ?? 0),
      page,
      pageSize,
    };
  },

  async getByRef(resendRef: string) {
    const sql = isResendNumber(resendRef)
      ? `${RESEND_SELECT} WHERE r.resend_number = $1`
      : `${RESEND_SELECT} WHERE r.id = $1`;
    const value = isResendNumber(resendRef) ? resendRef : Number(resendRef);
    const { rows } = await pool.query(sql, [value]);
    return rows[0] ? mapResend(rows[0]) : null;
  },

  async getAttachment(attachmentId: number) {
    const { rows } = await pool.query(
      `SELECT file_name, mime_type, file_data FROM resend_attachments WHERE id = $1`,
      [attachmentId]
    );
    return rows[0] ?? null;
  },

  async create(
    input: CreateResendInput,
    createdById: number,
    attachments: ResendAttachmentInput[]
  ) {
    const choices = await resolveChoices(input);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO resends (
           reference_no, order_id, category_name, email, type, sales_channel, sku, title,
           quantity, sale_price, shipping_cost, country, courier_service, tracking_number,
           reason, tags, accountable, item_returned, buyer_comment, comment,
           issue_listing, issue_warehouse, issue_logistics, issue_factory, created_by_id
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14,
           $15, $16, $17, $18, $19, $20,
           $21, $22, $23, $24, $25
         )
         RETURNING id`,
        [
          input.referenceNo,
          input.orderId,
          input.categoryName,
          input.email,
          choices.type,
          choices.salesChannel,
          input.sku,
          input.title,
          input.quantity,
          input.salePrice,
          input.shippingCost,
          choices.country,
          choices.courierService,
          input.trackingNumber,
          choices.reason,
          choices.tags,
          choices.accountable,
          choices.itemReturned,
          input.buyerComment,
          input.comment,
          input.issueListing,
          input.issueWarehouse,
          input.issueLogistics,
          input.issueFactory,
          createdById,
        ]
      );
      const resendId = rows[0].id as number;
      await insertAttachments(client, resendId, attachments);
      await client.query("COMMIT");
      return await this.getByRef(String(resendId));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
