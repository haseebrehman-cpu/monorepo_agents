import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../core/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function up() {
  await ensureTable();

  const applied = new Set(
    (await pool.query("SELECT name FROM _migrations")).rows.map(
      (r: { name: string }) => r.name
    )
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    await pool.end();
    return;
  }

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭  Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`▶ Applying ${file}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations(name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✅ ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`❌ Failed: ${file}`);
      console.error(e);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log("🎉 All migrations applied.");
  await pool.end();
}

async function down() {
  console.log("Manual rollback only — delete the SQL file and drop objects.");
  await pool.end();
}

const cmd = process.argv[2];
if (cmd === "up") up();
else if (cmd === "down") down();
else {
  console.log("Usage: tsx src/db/migrate.ts up|down");
  process.exit(1);
}