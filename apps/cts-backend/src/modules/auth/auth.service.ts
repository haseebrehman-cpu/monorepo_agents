import jwt from "jsonwebtoken";
import { pool } from "../../core/db.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../core/password.js";
import { loadUserAccess } from "../../core/access.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";

type JwtPayload = {
    userId: number;
    email: string;
};

export const authService = {
    async register(input: RegisterInput) {
        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [input.email]
        );
        if (existing.rowCount) throw new Error("User already exists");
        const passwordHash = await hashPassword(input.password);
        const { rows } = await pool.query(
            `INSERT INTO users (email, password_hash, name) 
            VALUES ($1, $2, $3) RETURNING id, email, name, is_active, created_at`,
            [input.email, passwordHash, input.name]
        );
        return rows[0];
    },

    async login(input: LoginInput) {
        const { rows } = await pool.query(
            `SELECT id, email, name, password_hash, is_active
            From users WHERE email = $1`,
            [input.email]
        );

        const user = rows[0];
        if (!user) throw new Error("Invalid credentials");
        if (!user.is_active) throw new Error("User is not active");

        const ok = await verifyPassword(input.password, user.password_hash);
        if (!ok) throw new Error("Invalid credentials");

        const token = jwt.sign({ userId: user.id, email: user.email } as JwtPayload, env.JWT_SECRET, { expiresIn: "1d" });
        const profile = await this.getMe(user.id);
        return {
            token,
            user: profile,
        };
    },

    async logout(_userId: number) {
        return { success: true };
    },

    async getMe(userId: number) {
        const { rows } = await pool.query(
            `SELECT id, email, name, is_active, created_at
             FROM users WHERE id = $1`,
            [userId]
        );

        if (!rows[0]) throw new Error("USER_NOT_FOUND");

        const user = rows[0];
        const access = await loadUserAccess(userId);

        return {
            ...user,
            department: access.department,
            roles: access.roles,
            permissions: access.permissions,
        };
    }
}
