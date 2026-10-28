CREATE SEQUENCE resend_number_seq;

CREATE TABLE resends (
  id                SERIAL PRIMARY KEY,
  resend_number     TEXT UNIQUE NOT NULL
                      DEFAULT ('RS-' || lpad(nextval('resend_number_seq')::text, 4, '0')),
  reference_no      TEXT NOT NULL,
  order_id          TEXT NOT NULL DEFAULT '',
  category_name     TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  type              TEXT NOT NULL,
  sales_channel     TEXT NOT NULL,
  sku               TEXT NOT NULL,
  title             TEXT NOT NULL,
  quantity          INTEGER NOT NULL,
  sale_price        TEXT NOT NULL,
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

CREATE TABLE resend_attachments (
  id          SERIAL PRIMARY KEY,
  resend_id   INTEGER NOT NULL REFERENCES resends(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  file_data   BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resends_created_at ON resends(created_at DESC);
CREATE INDEX idx_resends_type ON resends(type);
CREATE INDEX idx_resends_created_by ON resends(created_by_id);
CREATE INDEX idx_resend_attachments_resend ON resend_attachments(resend_id);

CREATE TABLE resend_lookups (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (
                kind IN ('type', 'sales_channel', 'reason', 'tag', 'accountable')
              ),
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_resend_lookups_kind_label
  ON resend_lookups (kind, lower(label));

CREATE INDEX idx_resend_lookups_kind_active
  ON resend_lookups (kind, is_active, sort_order, id);
