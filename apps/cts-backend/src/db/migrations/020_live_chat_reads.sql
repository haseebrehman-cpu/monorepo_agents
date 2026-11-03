CREATE TABLE live_chat_reads (
  conversation_id      UUID NOT NULL REFERENCES live_chat_conversations(id) ON DELETE CASCADE,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_live_chat_reads_user ON live_chat_reads (user_id);

CREATE INDEX idx_live_chat_recent
  ON live_chat_conversations (status, updated_at DESC);
