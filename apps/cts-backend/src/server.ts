import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./core/db.js";
import { CTS_SCHEMA } from "./core/postgres-config.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

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
    let shuttingDown = false;
    const shutdown = (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\nReceived ${signal}, shutting down...`);
      // Keep-alive sockets would otherwise hold server.close() open indefinitely.
      const forceExit = setTimeout(() => {
        console.error("Shutdown timed out, forcing exit");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();
      server.close(async () => {
        await pool.end();
        console.log("Server closed");
        process.exit(0);
      });
      server.closeIdleConnections();
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err);
    process.exit(1);
  }
}

start();