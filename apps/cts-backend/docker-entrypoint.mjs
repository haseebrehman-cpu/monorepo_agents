import { spawn } from "node:child_process";
import pg from "pg";

function connectionString(databaseUrl) {
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode === "require" || sslmode === "prefer") {
    url.searchParams.set("sslmode", "no-verify");
  }
  return url.toString();
}

const client = new pg.Client({
  connectionString: connectionString(process.env.DATABASE_URL),
});
await client.connect();
const existing = await client.query(
  "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cts'",
);
if (existing.rowCount === 0) {
  await client.query("CREATE SCHEMA cts");
}
await client.end();

function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

await run("dist/db/migrate.js", ["up"]);
if (process.env.SEED_ON_BOOT === "true") {
  await run("dist/db/seeds/seed.js");
}

const server = spawn(process.execPath, ["dist/server.js"], { stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => process.exit(code ?? 1));
