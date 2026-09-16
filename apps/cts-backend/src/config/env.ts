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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error.format());
    process.exit(1);
}

export const env: z.infer<typeof envSchema> = {
    NODE_ENV: require("NODE_ENV") as z.infer<typeof envSchema>["NODE_ENV"],
    PORT: parseInt(require("PORT")) as z.infer<typeof envSchema>["PORT"],
    DATABASE_URL: require("DATABASE_URL") as z.infer<typeof envSchema>["DATABASE_URL"],
    JWT_SECRET: require("JWT_SECRET") as z.infer<typeof envSchema>["JWT_SECRET"],
} satisfies z.infer<typeof envSchema>;