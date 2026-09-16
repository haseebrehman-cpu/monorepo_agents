import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  departmentId: z.number().int().positive(),
  roleId: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  departmentId: z.number().int().positive().optional(),
  roleId: z.number().int().positive().optional(),
});

export const updateUserPermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserPermissionsInput = z.infer<typeof updateUserPermissionsSchema>;
