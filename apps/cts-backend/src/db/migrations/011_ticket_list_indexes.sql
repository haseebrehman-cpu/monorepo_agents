CREATE INDEX IF NOT EXISTS idx_tickets_created_at_id
  ON tickets (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at
  ON tickets (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_department_created_at
  ON tickets (assigned_department_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_courier_created_at
  ON tickets (courier, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_issue_created_at
  ON tickets (issue, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_users_name
  ON users (name);

CREATE INDEX IF NOT EXISTS idx_departments_name
  ON departments (name);
