import {Client, Pool} from "pg";
import {env} from "../config/env.js";
import {connectionStringForPool, schemaSearchPathOption} from "./postgres-config.js";

/** A dedicated connection outside the pool, for long-lived LISTEN sessions. */
export function createDbClient() {
    return new Client({
        connectionString: connectionStringForPool(env.DATABASE_URL),
        connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
        options: schemaSearchPathOption(),
    });
}

export const pool = new Pool({
    connectionString: connectionStringForPool(env.DATABASE_URL),
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
    statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
    options: schemaSearchPathOption(),
});

pool.on("error", (err) => {
    console.error("Database connection error:", err);
});

export const db = {
    query: (text: string, params: any[]) => pool.query(text, params),
    end: () => pool.end(),
};

export default db;