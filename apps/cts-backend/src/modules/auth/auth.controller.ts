import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authController = {
    async register(req: Request, res: Response) {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.message });
        }

        try {
            const user = await authService.register(parsed.data);
            return res.status(201).json({ success: true, data: user });
        } catch (e: any) {
            if (e.message === "User already exists") {
                return res.status(400).json({ success: false, error: "USER_ALREADY_EXISTS" });
            }
            return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async login(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.message });
        };
        try {
            const result = await authService.login(parsed.data);
            return res.status(200).json({ success: true, data: result });
        } catch (e: any) {
            if (e.message === "Invalid credentials") {
                return res.status(401).json({ success: false, error: "INVALID_CREDENTIALS" });
            }
            return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
        }
    },

    async logout(req: Request, res: Response) {
        try {
            await authService.logout(req.user!.userId);
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