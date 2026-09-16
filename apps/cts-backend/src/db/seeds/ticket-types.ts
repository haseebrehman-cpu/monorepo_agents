import { pool } from "../../core/db.js";

type FieldDef = {
  field_key: string;
  label: string;
  field_type: string;
  is_required: boolean;
  default_value?: string;
  options_json?: any;
  sort_order: number;
};

const ticketTypes: {
  code: string;
  name: string;
  description: string;
  sort_order: number;
  fields: FieldDef[];
}[] = [
  {
    code: "refund",
    name: "Refund",
    description: "Refund a customer's order",
    sort_order: 1,
    fields: [
      { field_key: "order_id", label: "Order ID", field_type: "text", is_required: true, sort_order: 1 },
      { field_key: "amount", label: "Refund Amount", field_type: "number", is_required: true, sort_order: 2 },
      {
        field_key: "reason", label: "Reason", field_type: "select", is_required: true, sort_order: 3,
        options_json: [
          { value: "damaged", label: "Item Damaged" },
          { value: "wrong_item", label: "Wrong Item Sent" },
          { value: "not_delivered", label: "Not Delivered" },
          { value: "customer_request", label: "Customer Request" },
        ],
      },
      { field_key: "notes", label: "Additional Notes", field_type: "textarea", is_required: false, sort_order: 4 },
    ],
  },
  {
    code: "return",
    name: "Return",
    description: "Return an item",
    sort_order: 2,
    fields: [
      { field_key: "order_id", label: "Order ID", field_type: "text", is_required: true, sort_order: 1 },
      { field_key: "item_sku", label: "Item SKU", field_type: "text", is_required: true, sort_order: 2 },
      { field_key: "quantity", label: "Quantity", field_type: "number", is_required: true, default_value: "1", sort_order: 3 },
      { field_key: "reason", label: "Reason", field_type: "textarea", is_required: true, sort_order: 4 },
    ],
  },
  {
    code: "resend",
    name: "Resend",
    description: "Resend an order or item",
    sort_order: 3,
    fields: [
      { field_key: "order_id", label: "Order ID", field_type: "text", is_required: true, sort_order: 1 },
      { field_key: "address", label: "Shipping Address", field_type: "textarea", is_required: true, sort_order: 2 },
      { field_key: "carrier", label: "Carrier", field_type: "select", is_required: false, sort_order: 3,
        options_json: [
          { value: "dhl", label: "DHL" },
          { value: "fedex", label: "FedEx" },
          { value: "local", label: "Local Courier" },
        ],
      },
    ],
  },
];

export async function seedTicketTypes() {
  console.log("🌱 Seeding ticket types...");

  for (const tt of ticketTypes) {
    const { rows } = await pool.query(
      `INSERT INTO ticket_types (code, name, description, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             sort_order = EXCLUDED.sort_order
       RETURNING id`,
      [tt.code, tt.name, tt.description, tt.sort_order]
    );
    const ticketTypeId = rows[0].id;

    // Idempotent: delete all fields, re-insert
    await pool.query(`DELETE FROM ticket_type_fields WHERE ticket_type_id = $1`, [ticketTypeId]);

    for (const f of tt.fields) {
      await pool.query(
        `INSERT INTO ticket_type_fields
         (ticket_type_id, field_key, label, field_type, is_required, default_value, options_json, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ticketTypeId, f.field_key, f.label, f.field_type, f.is_required,
          f.default_value ?? null, f.options_json ? JSON.stringify(f.options_json) : null,
          f.sort_order,
        ]
      );
    }
    console.log(`   ✓ ${tt.code} (${tt.fields.length} fields)`);
  }
}