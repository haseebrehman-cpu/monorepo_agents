import type { Request, Response } from "express";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./departments.schema.js";
import { departmentsService } from "./departments.service.js";

function departmentError(res: Response, error: any) {
  const code = error?.message;
  if (code === "DEPARTMENT_ALREADY_EXISTS") {
    return res.status(400).json({ success: false, error: code });
  }
  if (code === "DEPARTMENT_NOT_FOUND") {
    return res.status(404).json({ success: false, error: code });
  }
  if (code === "DEPARTMENT_IN_USE") {
    return res.status(400).json({ success: false, error: code });
  }
  console.error("[departments] failed:", error);
  return res.status(500).json({ success: false, error: "INTERNAL_SERVER_ERROR" });
}

export const departmentsController = {
  async list(_req: Request, res: Response) {
    try {
      const departments = await departmentsService.list();
      return res.json({ success: true, data: departments });
    } catch (error) {
      return departmentError(res, error);
    }
  },

  async create(req: Request, res: Response) {
    const parsed = createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const department = await departmentsService.create(parsed.data);
      return res.status(201).json({ success: true, data: department });
    } catch (error) {
      return departmentError(res, error);
    }
  },

  async update(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    const parsed = updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.message });
    }
    try {
      const department = await departmentsService.update(id, parsed.data);
      return res.json({ success: true, data: department });
    } catch (error) {
      return departmentError(res, error);
    }
  },

  async remove(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: "INVALID_ID" });
    }
    try {
      await departmentsService.remove(id);
      return res.json({ success: true });
    } catch (error) {
      return departmentError(res, error);
    }
  },
};
