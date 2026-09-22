import "dotenv/config";
import { z } from "zod";

function require(key: string): string {
    const val = process.env[key];
    if (!val) {
        throw new Error(`Missing env var: ${key}`);
    }
    return val;
}

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    DB_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error.format());
    process.exit(1);
}

if (
    parsedEnv.data.NODE_ENV === "production" &&
    parsedEnv.data.JWT_SECRET.length < 32
) {
    console.error("JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
}

export const env: z.infer<typeof envSchema> = {
    NODE_ENV: require("NODE_ENV") as z.infer<typeof envSchema>["NODE_ENV"],
    PORT: parseInt(require("PORT")) as z.infer<typeof envSchema>["PORT"],
    DATABASE_URL: require("DATABASE_URL") as z.infer<typeof envSchema>["DATABASE_URL"],
    JWT_SECRET: require("JWT_SECRET") as z.infer<typeof envSchema>["JWT_SECRET"],
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE ?? "lax") as
        z.infer<typeof envSchema>["COOKIE_SAME_SITE"],
    DB_POOL_MAX: parsedEnv.data.DB_POOL_MAX,
    DB_IDLE_TIMEOUT_MS: parsedEnv.data.DB_IDLE_TIMEOUT_MS,
    DB_CONNECTION_TIMEOUT_MS: parsedEnv.data.DB_CONNECTION_TIMEOUT_MS,
    DB_STATEMENT_TIMEOUT_MS: parsedEnv.data.DB_STATEMENT_TIMEOUT_MS,
} satisfies z.infer<typeof envSchema>;