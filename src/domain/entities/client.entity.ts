/**
 * Represents the Client domain entity.
 * A Client is a User with extended client-specific attributes.
 */
export interface Client {
  id: number;
  userId: number;
  preferredPaymentMethod: string | null;
  loyaltyPoints: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Data required to create a new client profile */
export interface CreateClientData {
  userId: number;
  preferredPaymentMethod?: string;
  notes?: string;
}

/** Data allowed when updating a client profile */
export interface UpdateClientData {
  preferredPaymentMethod?: string | null;
  loyaltyPoints?: number;
  notes?: string | null;
}

/**
 * Registration data for a new client.
 * Combines user-level fields with optional client-specific fields.
 */
export interface RegisterClientData {
  firebaseUid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  preferredPaymentMethod?: string;
  notes?: string;
}
