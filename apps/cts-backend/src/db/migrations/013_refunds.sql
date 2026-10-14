CREATE SEQUENCE refund_number_seq;

CREATE TABLE refunds (
  id                SERIAL PRIMARY KEY,
  refund_number     TEXT UNIQUE NOT NULL
                      DEFAULT ('RF-' || lpad(nextval('refund_number_seq')::text, 4, '0')),
  reference_no      TEXT NOT NULL,
  order_id          TEXT NOT NULL DEFAULT '',
  category_name     TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  type              TEXT NOT NULL,
  sales_channel     TEXT NOT NULL,
  sku               TEXT NOT NULL,
  title             TEXT NOT NULL,
  quantity          INTEGER NOT NULL,
  sale_price        NUMERIC(12, 2) NOT NULL,
  refund_currency   TEXT NOT NULL,
  refund_price      NUMERIC(12, 2) NOT NULL,
  shipping_cost     NUMERIC(12, 2) NOT NULL,
  country           TEXT NOT NULL,
  courier_service   TEXT NOT NULL DEFAULT '',
  tracking_number   TEXT NOT NULL DEFAULT '',
  reason            TEXT NOT NULL,
  tags              TEXT NOT NULL,
  accountable       TEXT NOT NULL,
  item_returned     TEXT NOT NULL,
  buyer_comment     TEXT NOT NULL,
  comment           TEXT NOT NULL,
  issue_listing     BOOLEAN NOT NULL DEFAULT FALSE,
  issue_warehouse   BOOLEAN NOT NULL DEFAULT FALSE,
  issue_logistics   BOOLEAN NOT NULL DEFAULT FALSE,
  issue_factory     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_id     INTEGER NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refund_attachments (
  id          SERIAL PRIMARY KEY,
  refund_id   INTEGER NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  file_data   BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);
CREATE INDEX idx_refunds_type ON refunds(type);
CREATE INDEX idx_refund_attachments_refund ON refund_attachments(refund_id);
