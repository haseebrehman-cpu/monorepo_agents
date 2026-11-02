import jwt from "jsonwebtoken";
import { pool } from "../../core/db.js";
import { env } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../core/password.js";
import { loadUserAccess } from "../../core/access.js";
import {
    JWT_ALGORITHM,
    REFRESH_TTL_MS,
    SESSION_TTL_MS,
    type SessionPayload,
} from "../../core/auth-session.js";
import { createRefreshToken, hashRefreshToken } from "../../core/refresh-token.js";
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

        const tokens = await issueTokens(user);
        const profile = await this.getMe(user.id);
        return {
            ...tokens,
            user: profile,
        };
    },

    async refresh(refreshToken: string) {
        const tokenHash = hashRefreshToken(refreshToken);
        const client = await pool.connect();
        let failure: string | null = null;
        let tokens: IssuedTokens | null = null;
        try {
            await client.query("BEGIN");
            const { rows } = await client.query(
                `SELECT id, user_id, expires_at
                 FROM refresh_tokens
                 WHERE token_hash = $1
                 FOR UPDATE`,
                [tokenHash]
            );
            const stored = rows[0];
            if (!stored || new Date(stored.expires_at).getTime() <= Date.now()) {
                if (stored) {
                    await client.query(`DELETE FROM refresh_tokens WHERE id = $1`, [stored.id]);
                }
                failure = "INVALID_REFRESH_TOKEN";
            } else {
                const { rows: users } = await client.query(
                    `SELECT id, email, is_active, session_version
                     FROM users WHERE id = $1`,
                    [stored.user_id]
                );
                const user = users[0];
                if (!user || !user.is_active) {
                    await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [stored.user_id]);
                    failure = "User is not active";
                } else {
                    await client.query(`DELETE FROM refresh_tokens WHERE id = $1`, [stored.id]);
                    tokens = await insertRefreshToken(client, user);
                }
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
        if (failure) throw new Error(failure);
        return tokens!;
    },

    async logout(userId: number) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const { rowCount } = await client.query(
                `UPDATE users SET session_version = session_version + 1 WHERE id = $1`,
                [userId]
            );
            if (!rowCount) throw new Error("USER_NOT_FOUND");
            await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
            await client.query("COMMIT");
            return { success: true };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
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

type SessionUser = {
    id: number;
    email: string;
    session_version: number;
};

type Queryable = {
    query: (text: string, params?: unknown[]) => Promise<unknown>;
};

type IssuedTokens = {
    token: string;
    refreshToken: string;
};

function signSession(user: SessionUser): string {
    const payload: SessionPayload = {
        userId: user.id,
        email: user.email,
        sv: Number(user.session_version ?? 0),
    };
    return jwt.sign(payload, env.JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        expiresIn: SESSION_TTL_MS / 1000,
    });
}

async function insertRefreshToken(db: Queryable, user: SessionUser): Promise<IssuedTokens> {
    const refreshToken = createRefreshToken();
    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, hashRefreshToken(refreshToken), new Date(Date.now() + REFRESH_TTL_MS)]
    );
    return { token: signSession(user), refreshToken };
}

async function issueTokens(user: SessionUser): Promise<IssuedTokens> {
    return insertRefreshToken(pool, user);
}
