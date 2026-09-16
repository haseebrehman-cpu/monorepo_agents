-- ============================================
-- TICKET TYPES (refund, return, resend, cancel...)
-- ============================================
CREATE TABLE ticket_types (
  id          SERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dynamic form fields for each ticket type
CREATE TABLE ticket_type_fields (
  id             SERIAL PRIMARY KEY,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  field_key      TEXT NOT NULL,
  label          TEXT NOT NULL,
  field_type     TEXT NOT NULL,           -- 'text', 'number', 'select', 'textarea', 'date', 'checkbox'
  is_required    BOOLEAN NOT NULL DEFAULT FALSE,
  default_value  TEXT,
  options_json   JSONB,                    -- for select fields: [{"value":"x","label":"X"}]
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (ticket_type_id, field_key)
);

CREATE INDEX idx_tt_fields_type ON ticket_type_fields(ticket_type_id);

-- ============================================
-- FEATURE FLAGS (per role or global)
-- ============================================
CREATE TABLE feature_flags (
  id         SERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  value_json JSONB NOT NULL,               -- true, false, string, number, object
  role_id    INTEGER REFERENCES roles(id) ON DELETE CASCADE,  -- NULL = global
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key, role_id)
);

-- ============================================
-- DASHBOARD WIDGETS (per role)
-- ============================================
CREATE TABLE dashboard_widgets (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL,                -- 'open_tickets', 'refund_trend'
  title       TEXT NOT NULL,
  widget_type TEXT NOT NULL,                -- 'stat', 'chart', 'table', 'list'
  config_json JSONB,                        -- { "metric": "count", "range": "30d" }
  role_id     INTEGER REFERENCES roles(id) ON DELETE CASCADE,  -- NULL = all roles
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (key, role_id)
);