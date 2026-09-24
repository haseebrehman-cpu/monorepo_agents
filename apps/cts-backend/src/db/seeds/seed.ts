import { pool } from "../../core/db.js";
import { hashPassword } from "../../core/password.js";
import { DEFAULT_ROLES, DEPARTMENTS, FEATURES, ROLE } from "../../config/features.js";
import { seedTicketTypes } from "./ticket-types.js";

async function seedDepartments() {
  console.log("🌱 Seeding departments...");
  for (const department of DEPARTMENTS) {
    await pool.query(
      `INSERT INTO departments (code, name)
       VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
      [department.code, department.name]
    );
    console.log(`   ✓ ${department.name}`);
  }

  await pool.query(
    `UPDATE users
     SET department_id = (SELECT id FROM departments WHERE code = 'customer_support')
     WHERE department_id IS NULL
       AND id NOT IN (
         SELECT ur.user_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE r.code = 'super_admin'
       )`
  );
}

async function seedFeatures() {
  console.log("🌱 Seeding features...");
  for (const feature of FEATURES) {
    await pool.query(
      `INSERT INTO permissions (code, description, label, feature_group, kind, parent_code, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (code) DO UPDATE
         SET description = EXCLUDED.description,
             label = EXCLUDED.label,
             feature_group = EXCLUDED.feature_group,
             kind = EXCLUDED.kind,
             parent_code = EXCLUDED.parent_code,
             sort_order = EXCLUDED.sort_order`,
      [
        feature.code,
        feature.label,
        feature.label,
        feature.group,
        feature.kind,
        feature.parentCode ?? null,
        feature.sortOrder,
      ]
    );
  }

  await remapLegacyRefundResendPermissions();

  const keepCodes = FEATURES.map((feature) => feature.code);
  await pool.query(`DELETE FROM permissions WHERE NOT (code = ANY($1::text[]))`, [
    keepCodes,
  ]);
  console.log(`   ✓ ${FEATURES.length} features`);
}

async function remapLegacyRefundResendPermissions() {
  const remaps: Array<{ from: string; to: string[] }> = [
    {
      from: "refund_resend.access",
      to: ["refund.access", "resend.access", "return.access"],
    },
    { from: "refund_resend.resend_access", to: ["resend.access"] },
    { from: "refund_resend.return_access", to: ["return.access"] },
    { from: "refund_resend.create_refund", to: ["refund.create"] },
    { from: "refund_resend.create_resend", to: ["resend.create"] },
    { from: "refund_resend.create_return", to: ["return.create"] },
  ];

  for (const { from, to } of remaps) {
    for (const next of to) {
      await pool.query(
        `INSERT INTO user_permissions (user_id, permission_id)
         SELECT up.user_id, dest.id
         FROM user_permissions up
         JOIN permissions src ON src.id = up.permission_id AND src.code = $1
         JOIN permissions dest ON dest.code = $2
         ON CONFLICT DO NOTHING`,
        [from, next]
      );
    }
  }
}

async function seedRoles() {
  console.log("🌱 Seeding roles...");
  for (const role of DEFAULT_ROLES) {
    await pool.query(
      `INSERT INTO roles (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description`,
      [role.code, role.name, role.description]
    );
    console.log(`   ✓ ${role.name}`);
  }

  await pool.query(
    `UPDATE user_roles
     SET role_id = (SELECT id FROM roles WHERE code = 'user')
     WHERE role_id IN (SELECT id FROM roles WHERE code IN ('agent', 'supervisor'))`
  );
  await pool.query(
    `DELETE FROM roles WHERE code NOT IN ('super_admin', 'admin', 'user', 'viewer')`
  );

  await pool.query(`DELETE FROM role_permissions`);

  const { rows: adminRole } = await pool.query(
    `SELECT id FROM roles WHERE code = $1`,
    [ROLE.ADMIN]
  );
  const adminRoleId = adminRole[0]?.id;
  if (adminRoleId) {
    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT $1, id FROM permissions
       ON CONFLICT DO NOTHING`,
      [adminRoleId]
    );
  }
}

async function seedSuperAdmin() {
  console.log("🌱 Seeding super admin...");
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

  const { rows: roleRows } = await pool.query(
    `SELECT id FROM roles WHERE code = $1`,
    [ROLE.SUPER_ADMIN]
  );
  const superAdminRoleId = roleRows[0]?.id as number | undefined;
  if (!superAdminRoleId) {
    throw new Error("super_admin role is missing");
  }

  const { rows: existingSuperAdmins } = await pool.query(
    `SELECT u.id, u.email
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     JOIN roles r ON r.id = ur.role_id
     WHERE r.code = $1
     ORDER BY u.id`,
    [ROLE.SUPER_ADMIN]
  );

  if (!email || !password) {
    if (existingSuperAdmins.length === 0) {
      console.warn(
        "   ⚠️ SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set; no super admin created."
      );
      return;
    }
    await demoteExtraSuperAdmins(
      existingSuperAdmins[0].id as number,
      existingSuperAdmins.slice(1).map((row: { id: number }) => row.id)
    );
    console.log(`   ✓ Super admin ${existingSuperAdmins[0].email}`);
    return;
  }

  const { rows: byEmail } = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    email,
  ]);

  let userId: number;
  if (byEmail[0]) {
    userId = byEmail[0].id as number;
    await pool.query(
      `UPDATE users SET name = $2, is_active = TRUE, updated_at = NOW() WHERE id = $1`,
      [userId, name]
    );
  } else {
    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [email, passwordHash, name]
    );
    userId = rows[0].id as number;
  }

  await pool.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1`, [userId]);
  await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [
    userId,
    superAdminRoleId,
  ]);

  const extraIds = existingSuperAdmins
    .map((row: { id: number }) => row.id)
    .filter((id: number) => id !== userId);
  await demoteExtraSuperAdmins(userId, extraIds);
  console.log(`   ✓ Super admin ${email}`);
}

async function demoteExtraSuperAdmins(keepUserId: number, extraIds: number[]) {
  if (extraIds.length === 0) return;

  const { rows: adminRole } = await pool.query(`SELECT id FROM roles WHERE code = $1`, [
    ROLE.ADMIN,
  ]);
  const adminRoleId = adminRole[0]?.id as number | undefined;
  if (!adminRoleId) return;

  await pool.query(`DELETE FROM user_roles WHERE user_id = ANY($1::int[])`, [extraIds]);
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT unnest($1::int[]), $2
     ON CONFLICT DO NOTHING`,
    [extraIds, adminRoleId]
  );
  console.log(
    `   ✓ Kept super admin #${keepUserId}; demoted ${extraIds.length} extra account(s) to admin`
  );
}

async function main() {
  try {
    await seedDepartments();
    await seedFeatures();
    await seedRoles();
    await seedSuperAdmin();
    await seedTicketTypes();
    console.log("🎉 Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
