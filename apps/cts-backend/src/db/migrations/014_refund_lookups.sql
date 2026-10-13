CREATE TABLE refund_lookups (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (
                kind IN ('type', 'sales_channel', 'currency', 'reason', 'tag', 'accountable')
              ),
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_refund_lookups_kind_label
  ON refund_lookups (kind, lower(label));

CREATE INDEX idx_refund_lookups_kind_active
  ON refund_lookups (kind, is_active, sort_order, id);
