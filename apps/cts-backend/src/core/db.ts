import {Pool} from "pg";
import {env} from "../config/env.js";

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
    console.error("Database connection error:", err);
});

export const db = {
    query: (text: string, params: any[]) => pool.query(text, params),
    end: () => pool.end(),
};

export default db;