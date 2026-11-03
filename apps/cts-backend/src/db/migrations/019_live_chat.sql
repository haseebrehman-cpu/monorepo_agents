-- Rows are optional. A support member without a row uses the default limit and is accepting.
CREATE TABLE live_chat_members (
  user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  queue_limit SMALLINT NOT NULL DEFAULT 6 CHECK (queue_limit BETWEEN 1 AND 12),
  accepting   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE live_chat_conversations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_conversation_id TEXT NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'waiting'
                             CHECK (status IN ('waiting', 'active', 'resolved')),
  queued_for_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  owner_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name            TEXT NOT NULL,
  customer_email           TEXT NOT NULL,
  channel                  TEXT NOT NULL,
  order_number             TEXT,
  handoff_reason           TEXT NOT NULL,
  ai_summary               TEXT NOT NULL,
  tags                     TEXT[] NOT NULL DEFAULT '{}',
  location                 TEXT NOT NULL DEFAULT '',
  current_page             TEXT NOT NULL DEFAULT '',
  visits                   INTEGER NOT NULL DEFAULT 0 CHECK (visits >= 0),
  browser                  TEXT NOT NULL DEFAULT '',
  referrer                 TEXT NOT NULL DEFAULT '',
  handed_off_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at              TIMESTAMPTZ,
  CONSTRAINT live_chat_queue_only_while_waiting
    CHECK (status = 'waiting' OR queued_for_id IS NULL),
  CONSTRAINT live_chat_no_owner_while_waiting
    CHECK (status <> 'waiting' OR owner_id IS NULL)
);

-- One open desk conversation per chatbot conversation. A closed one may be handed off again.
CREATE UNIQUE INDEX uniq_live_chat_open_external
  ON live_chat_conversations (external_conversation_id)
  WHERE status <> 'resolved';

CREATE INDEX idx_live_chat_unassigned
  ON live_chat_conversations (handed_off_at, id)
  WHERE status = 'waiting' AND queued_for_id IS NULL;

CREATE INDEX idx_live_chat_queued_for
  ON live_chat_conversations (queued_for_id)
  WHERE status = 'waiting';

CREATE INDEX idx_live_chat_owner
  ON live_chat_conversations (owner_id, status);

CREATE TABLE live_chat_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES live_chat_conversations(id) ON DELETE CASCADE,
  author          TEXT NOT NULL
                    CHECK (author IN ('customer', 'assistant', 'agent', 'system', 'note')),
  author_name     TEXT NOT NULL,
  author_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body            TEXT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_chat_messages_conversation
  ON live_chat_messages (conversation_id, sent_at, id);
