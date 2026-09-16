CREATE TABLE departments (
  id         SERIAL PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO departments (code, name) VALUES
  ('customer_support', 'Customer Support'),
  ('compliance', 'Compliance'),
  ('supply_chain', 'Supply Chain Management')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE users
  ADD COLUMN department_id INTEGER REFERENCES departments(id);

CREATE TABLE user_permissions (
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_users_department ON users(department_id);

ALTER TABLE permissions
  ADD COLUMN label TEXT,
  ADD COLUMN feature_group TEXT,
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'access',
  ADD COLUMN parent_code TEXT,
  ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

DELETE FROM user_roles a
WHERE a.ctid NOT IN (
  SELECT min(ctid) FROM user_roles GROUP BY user_id
);

CREATE UNIQUE INDEX uniq_user_one_role ON user_roles (user_id);
