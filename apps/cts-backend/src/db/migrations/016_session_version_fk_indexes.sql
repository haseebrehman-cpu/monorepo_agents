ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets (created_by_id);
CREATE INDEX IF NOT EXISTS idx_tickets_modified_by ON tickets (modified_by_id);
CREATE INDEX IF NOT EXISTS idx_tickets_closed_by ON tickets (closed_by_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_by ON ticket_replies (created_by_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_department ON ticket_replies (assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_ticket_events_actor ON ticket_events (actor_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created_by ON refunds (created_by_id);
