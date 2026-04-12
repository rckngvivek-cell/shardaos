import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'teacher', 'student', 'parent']);
export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const userSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string().trim().min(2).max(100),
  role: userRoleSchema,
  schoolId: z.string(),
  permissions: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  lastLogin: z.string().datetime().optional(),
  status: userStatusSchema.default('active')
});

export const createUserSchema = userSchema
  .omit({
    userId: true,
    createdAt: true,
    lastLogin: true,
    status: true
  })
  .extend({
    status: userStatusSchema.default('active'),
    permissions: z.array(z.string()).default([])
  });

export const updateUserSchema = createUserSchema.partial().omit({ email: true, role: true, schoolId: true });

export const userQuerySchema = z.object({
  schoolId: z.string().optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
