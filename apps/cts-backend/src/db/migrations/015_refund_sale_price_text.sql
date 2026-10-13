ALTER TABLE refunds
  ALTER COLUMN sale_price TYPE TEXT USING sale_price::text;
