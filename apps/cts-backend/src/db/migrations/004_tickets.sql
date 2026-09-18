CREATE SEQUENCE ticket_number_seq;

CREATE TABLE tickets (
  id               SERIAL PRIMARY KEY,
  ticket_number    TEXT UNIQUE NOT NULL
                     DEFAULT ('CTS-' || lpad(nextval('ticket_number_seq')::text, 4, '0')),
  order_id         TEXT NOT NULL,
  courier          TEXT NOT NULL,
  tracking_number  TEXT NOT NULL,
  issue            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Open',
  comment_html     TEXT NOT NULL DEFAULT '',
  assigned_to_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_id    INTEGER NOT NULL REFERENCES users(id),
  modified_by_id   INTEGER REFERENCES users(id),
  closed_by_id     INTEGER REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at        TIMESTAMPTZ
);

CREATE TABLE ticket_attachments (
  id          SERIAL PRIMARY KEY,
  ticket_id   INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  file_data   BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
