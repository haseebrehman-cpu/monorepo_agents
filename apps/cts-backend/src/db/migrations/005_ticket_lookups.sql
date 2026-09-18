CREATE TABLE ticket_lookups (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('courier', 'issue', 'status')),
  label       TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  is_closed   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ticket_lookups_kind_label
  ON ticket_lookups (kind, lower(label));

CREATE INDEX idx_ticket_lookups_kind_active
  ON ticket_lookups (kind, is_active, sort_order, id);

INSERT INTO ticket_lookups (kind, label, is_closed, sort_order) VALUES
  ('courier', 'DHL',    FALSE, 10),
  ('courier', 'FedEx',  FALSE, 20),
  ('courier', 'UPS',    FALSE, 30),
  ('courier', 'Aramex', FALSE, 40),
  ('issue',   'Delayed',       FALSE, 10),
  ('issue',   'Lost',          FALSE, 20),
  ('issue',   'Damaged',       FALSE, 30),
  ('issue',   'Wrong address', FALSE, 40),
  ('status',  'Open',        FALSE, 10),
  ('status',  'In progress', FALSE, 20),
  ('status',  'Resolved',    TRUE,  30),
  ('status',  'Closed',      TRUE,  40);
