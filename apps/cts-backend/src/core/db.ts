import {Pool} from "pg";
import {env} from "../config/env.js";

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
});

pool.on("error", (err) => {
    console.error("Database connection error:", err);
});

export const db = {
    query: (text: string, params: any[]) => pool.query(text, params),
    end: () => pool.end(),
};

export default db;