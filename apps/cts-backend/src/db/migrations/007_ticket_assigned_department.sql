ALTER TABLE tickets
  ADD COLUMN assigned_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

UPDATE tickets t
SET assigned_department_id = u.department_id
FROM users u
WHERE t.assigned_to_id = u.id;

ALTER TABLE tickets DROP COLUMN assigned_to_id;

CREATE INDEX idx_tickets_assigned_department ON tickets(assigned_department_id);

ALTER TABLE ticket_replies
  ADD COLUMN assigned_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

UPDATE ticket_replies r
SET assigned_department_id = u.department_id
FROM users u
WHERE r.assigned_to_id = u.id;

ALTER TABLE ticket_replies DROP COLUMN assigned_to_id;

ALTER TABLE ticket_events
  ADD COLUMN assigned_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

UPDATE ticket_events e
SET assigned_department_id = u.department_id
FROM users u
WHERE e.assigned_to_id = u.id;

ALTER TABLE ticket_events DROP COLUMN assigned_to_id;

CREATE UNIQUE INDEX uniq_departments_name_lower ON departments (lower(name));
