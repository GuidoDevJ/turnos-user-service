/**
 * Represents the Professional domain entity.
 * A Professional is a User with extended professional-specific attributes.
 */
export interface Professional {
  id: number;
  userId: number;
  bio: string | null;
  specialization: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Data required to create a new professional profile */
export interface CreateProfessionalData {
  userId: number;
  bio?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsExperience?: number;
}

/** Data allowed when updating a professional profile */
export interface UpdateProfessionalData {
  bio?: string | null;
  specialization?: string | null;
  licenseNumber?: string | null;
  yearsExperience?: number | null;
  isAvailable?: boolean;
}

/**
 * Registration data for a new professional.
 * Combines user-level fields with optional professional-specific fields.
 */
export interface RegisterProfessionalData {
  firebaseUid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  bio?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsExperience?: number;
}
