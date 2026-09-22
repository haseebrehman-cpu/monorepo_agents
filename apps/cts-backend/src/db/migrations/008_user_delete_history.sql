-- Keep ticket history when an access-control user is deleted. Historical
-- actor fields become NULL and the API renders them as "Deleted user".
ALTER TABLE tickets
  ALTER COLUMN created_by_id DROP NOT NULL,
  DROP CONSTRAINT tickets_created_by_id_fkey,
  ADD CONSTRAINT tickets_created_by_id_fkey
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  DROP CONSTRAINT tickets_modified_by_id_fkey,
  ADD CONSTRAINT tickets_modified_by_id_fkey
    FOREIGN KEY (modified_by_id) REFERENCES users(id) ON DELETE SET NULL,
  DROP CONSTRAINT tickets_closed_by_id_fkey,
  ADD CONSTRAINT tickets_closed_by_id_fkey
    FOREIGN KEY (closed_by_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE ticket_replies
  ALTER COLUMN created_by_id DROP NOT NULL,
  DROP CONSTRAINT ticket_replies_created_by_id_fkey,
  ADD CONSTRAINT ticket_replies_created_by_id_fkey
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE ticket_events
  ALTER COLUMN actor_id DROP NOT NULL,
  DROP CONSTRAINT ticket_events_actor_id_fkey,
  ADD CONSTRAINT ticket_events_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
