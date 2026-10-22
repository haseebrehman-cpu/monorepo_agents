import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./core/db.js";
import { CTS_SCHEMA } from "./core/postgres-config.js";

async function start() {
  try {
    const { rows } = await pool.query<{ schema: string | null }>(
      "SELECT current_schema() AS schema"
    );
    const schema = rows[0]?.schema;
    if (schema !== CTS_SCHEMA) {
      throw new Error(
        `Refusing to start: database search_path is "${schema ?? "unset"}", expected "${CTS_SCHEMA}".`
      );
    }
    console.log(`✅ Postgres connected (schema ${schema})`);

    // 2. Then start the server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });

    // 3. Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down...`);
      server.close(async () => {
        await pool.end();
        console.log("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err);
    process.exit(1);
  }
}

start();