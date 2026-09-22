-- Retain the oldest ticket for each duplicated order ID or tracking number.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(btrim(order_id))
      ORDER BY created_at ASC, id ASC
    ) AS order_rank,
    ROW_NUMBER() OVER (
      PARTITION BY lower(btrim(tracking_number))
      ORDER BY created_at ASC, id ASC
    ) AS tracking_rank
  FROM tickets
)
DELETE FROM tickets
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE order_rank > 1 OR tracking_rank > 1
);

CREATE UNIQUE INDEX uniq_tickets_order_id_ci
  ON tickets (lower(btrim(order_id)));

CREATE UNIQUE INDEX uniq_tickets_tracking_number_ci
  ON tickets (lower(btrim(tracking_number)));
