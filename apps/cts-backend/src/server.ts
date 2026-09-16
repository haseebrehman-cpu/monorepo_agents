import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./core/db.js";

async function start() {
  try {
    // 1. Test DB connection BEFORE accepting traffic
    await pool.query("SELECT 1");
    console.log("✅ Postgres connected");

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