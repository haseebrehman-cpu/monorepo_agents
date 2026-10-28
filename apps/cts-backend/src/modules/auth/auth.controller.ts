import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import {
    clearSessionCookieOptions,
    SESSION_COOKIE_NAME,
    sessionCookieOptions,
} from "../../core/auth-session.js";
import { createAttemptLimiter } from "../../core/rate-limit.js";

const loginLimiter = createAttemptLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
});

export const authController = {
    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.message });
        };

        const limiterKey = `${req.ip ?? ""}|${parsed.data.email.toLowerCase()}`;
        const retryAfter = loginLimiter.retryAfterSeconds(limiterKey);
        if (retryAfter > 0) {
            res.setHeader("Retry-After", String(retryAfter));
            return res.status(429).json({ success: false, error: "TOO_MANY_LOGIN_ATTEMPTS" });
        }

        try {
            const result = await authService.login(parsed.data);
            loginLimiter.reset(limiterKey);
            res.cookie(SESSION_COOKIE_NAME, result.token, sessionCookieOptions);
            return res.status(200).json({
                success: true,
                data: { user: result.user },
            });
        } catch (e: any) {
            if (e.message === "Invalid credentials") {
                loginLimiter.recordFailure(limiterKey);
                return res.status(401).json({ success: false, error: "INVALID_CREDENTIALS" });
            }
            if (e.message === "User is not active") {
                return res.status(403).json({ success: false, error: "USER_INACTIVE" });
            }
            console.error("[auth.login] failed:", e);
            return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async logout(req: Request, res: Response) {
        try {
            await authService.logout(req.user!.userId);
            res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions);
            return res.json({ success: true });
        } catch (e: any) {
            if (e.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
            }
            return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async me(req: Request, res: Response) {
        try {
            const user = await authService.getMe(req.user!.userId);
            return res.json({ success: true, user });
        } catch (e: any) {
            if (e.message === "USER_NOT_FOUND") {
                return res.status(404).json({ success: false, error: "USER_NOT_FOUND" });
            }
            return res.status(500).json({ success: false, error: "SERVER_ERROR" });
        }
    }
}
