import { pool } from "../../core/db.js";
import { ASSIGNABLE_ROLE_CODES, FEATURES } from "../../config/features.js";

type PermissionRow = {
  id: number;
  code: string;
  description: string | null;
  label: string | null;
  feature_group: string | null;
  kind: string;
  parent_code: string | null;
  sort_order: number;
};

function toFeature(row: PermissionRow) {
  return {
    id: row.id,
    code: row.code,
    label: row.label || row.description || row.code,
    group: row.feature_group || "Other",
    kind: row.kind,
    parentCode: row.parent_code,
    sortOrder: row.sort_order,
  };
}

export const rolesService = {
  async list() {
    const { rows } = await pool.query(
      `SELECT id, code, name, description
       FROM roles
       WHERE code = ANY($1::text[])
       ORDER BY array_position($1::text[], code)`,
      [[...ASSIGNABLE_ROLE_CODES]]
    );
    return rows;
  },

  async listPermissions() {
    const { rows } = await pool.query(
      `SELECT id, code, description, label, feature_group, kind, parent_code, sort_order
       FROM permissions
       ORDER BY sort_order, code`
    );
    return (rows as PermissionRow[]).map(toFeature);
  },

  async listFeatures() {
    const permissions = await this.listPermissions();
    const groups = new Map<string, typeof permissions>();
    const groupOrder = [...new Set(FEATURES.map((feature) => feature.group))];

    for (const permission of permissions) {
      const list = groups.get(permission.group) ?? [];
      list.push(permission);
      groups.set(permission.group, list);
    }

    return groupOrder
      .filter((group) => groups.has(group))
      .map((group) => ({
        group,
        features: groups.get(group) ?? [],
      }));
  },
};
