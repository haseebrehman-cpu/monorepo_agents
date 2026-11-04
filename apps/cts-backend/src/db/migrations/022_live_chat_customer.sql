-- Wording the customer sees for a system message. NULL keeps the message desk-only.
ALTER TABLE live_chat_messages
  ADD COLUMN customer_body TEXT,
  ADD COLUMN client_message_id TEXT;

-- A customer send retried with the same client id is stored once.
CREATE UNIQUE INDEX uniq_live_chat_client_message
  ON live_chat_messages (conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;
