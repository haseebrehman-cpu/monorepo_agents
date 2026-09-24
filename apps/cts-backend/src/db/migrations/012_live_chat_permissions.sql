INSERT INTO permissions (
  code,
  description,
  label,
  feature_group,
  kind,
  parent_code,
  sort_order
)
VALUES
  (
    'live_chat.access',
    'Access Live Chat',
    'Access Live Chat',
    'Live Chat',
    'access',
    NULL,
    70
  ),
  (
    'live_chat.reply',
    'Reply to customer',
    'Reply to customer',
    'Live Chat',
    'action',
    'live_chat.access',
    71
  ),
  (
    'live_chat.assign',
    'Assign conversation',
    'Assign conversation',
    'Live Chat',
    'action',
    'live_chat.access',
    72
  ),
  (
    'live_chat.resolve',
    'Resolve conversation',
    'Resolve conversation',
    'Live Chat',
    'action',
    'live_chat.access',
    73
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
  AND p.code IN (
    'live_chat.access',
    'live_chat.reply',
    'live_chat.assign',
    'live_chat.resolve'
  )
ON CONFLICT DO NOTHING;
