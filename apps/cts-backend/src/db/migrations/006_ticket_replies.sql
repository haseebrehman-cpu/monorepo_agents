CREATE TABLE ticket_replies (
  id              SERIAL PRIMARY KEY,
  ticket_id       INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  body_html       TEXT NOT NULL DEFAULT '',
  assigned_to_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by_id   INTEGER NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_replies_ticket ON ticket_replies(ticket_id, created_at);

ALTER TABLE ticket_attachments
  ADD COLUMN reply_id INTEGER REFERENCES ticket_replies(id) ON DELETE CASCADE;

CREATE INDEX idx_ticket_attachments_reply ON ticket_attachments(reply_id);

CREATE TABLE ticket_events (
  id              SERIAL PRIMARY KEY,
  ticket_id       INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed')),
  actor_id        INTEGER NOT NULL REFERENCES users(id),
  assigned_to_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  from_value      TEXT,
  to_value        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_events_ticket ON ticket_events(ticket_id, created_at);

INSERT INTO ticket_events (ticket_id, event_type, actor_id, assigned_to_id, to_value, created_at)
SELECT id, 'created', created_by_id, assigned_to_id, status, created_at
FROM tickets;
