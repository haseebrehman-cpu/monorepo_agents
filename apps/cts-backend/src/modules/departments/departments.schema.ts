import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(80),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(80),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
