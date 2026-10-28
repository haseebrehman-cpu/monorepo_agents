import jwt from "jsonwebtoken";
import { pool } from "../../core/db.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../core/password.js";
import { loadUserAccess } from "../../core/access.js";
import { JWT_ALGORITHM, type SessionPayload } from "../../core/auth-session.js";
import type { LoginInput } from "./auth.schema.js";

// Compared against when the email is unknown so response time does not reveal which accounts exist.
const dummyPasswordHash = hashPassword("cts-timing-equalizer");

export const authService = {
    async login(input: LoginInput) {
        const { rows } = await pool.query(
            `SELECT id, email, name, password_hash, is_active, session_version
            FROM users WHERE email = $1`,
            [input.email]
        );

        const user = rows[0];
        if (!user) {
            await verifyPassword(input.password, await dummyPasswordHash);
            throw new Error("Invalid credentials");
        }

        const ok = await verifyPassword(input.password, user.password_hash);
        if (!ok) throw new Error("Invalid credentials");
        if (!user.is_active) throw new Error("User is not active");

        const payload: SessionPayload = {
            userId: user.id,
            email: user.email,
            sv: Number(user.session_version ?? 0),
        };
        const token = jwt.sign(payload, env.JWT_SECRET, {
            algorithm: JWT_ALGORITHM,
            expiresIn: "1d",
        });
        const profile = await this.getMe(user.id);
        return {
            token,
            user: profile,
        };
    },

    async logout(userId: number) {
        const { rowCount } = await pool.query(
            `UPDATE users SET session_version = session_version + 1 WHERE id = $1`,
            [userId]
        );
        if (!rowCount) throw new Error("USER_NOT_FOUND");
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
