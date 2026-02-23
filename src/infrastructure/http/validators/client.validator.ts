import { z } from "zod";

/** Schema for registering a new client (user + client-specific fields) */
export const registerClientSchema = z.object({
  firebaseUid: z.string().min(1, "Firebase UID is required").max(128),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email format").max(255),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  preferredPaymentMethod: z
    .string()
    .max(50, "Payment method must be at most 50 characters")
    .optional(),
  notes: z.string().optional(),
});

/** Schema for updating a client profile */
export const updateClientSchema = z.object({
  preferredPaymentMethod: z.string().max(50).nullable().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
});

export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
