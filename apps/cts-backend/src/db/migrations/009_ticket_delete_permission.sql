INSERT INTO permissions (
  code,
  description,
  label,
  feature_group,
  kind,
  parent_code,
  sort_order
)
VALUES (
  'tracking.delete',
  'Delete Tracking',
  'Delete Tracking',
  'Tracking',
  'action',
  'tracking.access',
  13
)
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description,
    label = EXCLUDED.label,
    feature_group = EXCLUDED.feature_group,
    kind = EXCLUDED.kind,
    parent_code = EXCLUDED.parent_code,
    sort_order = EXCLUDED.sort_order;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code = 'tracking.delete'
ON CONFLICT DO NOTHING;
