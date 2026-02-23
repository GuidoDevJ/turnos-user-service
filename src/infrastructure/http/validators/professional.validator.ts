import { z } from "zod";

/** Schema for registering a new professional (user + professional-specific fields) */
export const registerProfessionalSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required").max(128),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format").max(255),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  specialization: z.string().max(100).optional(),
  licenseNumber: z.string().max(50).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
});

/** Schema for updating a professional profile */
export const updateProfessionalSchema = z.object({
  bio: z.string().nullable().optional(),
  specialization: z.string().max(100).nullable().optional(),
  licenseNumber: z.string().max(50).nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export type RegisterProfessionalInput = z.infer<typeof registerProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
