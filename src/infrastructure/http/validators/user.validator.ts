import { z } from "zod";

/** Schema for creating a user */
export const createUserSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required").max(128),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format").max(255),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  roleId: z.number().int().positive("Role ID must be a positive integer"),
});

/** Schema for updating a user */
export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email("Invalid email format").max(255).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().nullable().optional(),
  roleId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

/** Schema for pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/** Schema for ID route param */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

/** Schema for email route param */
export const emailParamSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/** Schema for registering a client or professional (no roleId needed) */
export const registerUserSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required").max(128),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format").max(255),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
