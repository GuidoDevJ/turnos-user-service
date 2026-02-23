import {
  Professional,
  CreateProfessionalData,
  UpdateProfessionalData,
} from "../entities/professional.entity";

/**
 * Port: Professional repository interface.
 * Defines the contract for any persistence adapter that manages Professional profiles.
 */
export interface IProfessionalRepository {
  /** Create a new professional profile linked to an existing user */
  create(data: CreateProfessionalData): Promise<Professional>;

  /** Find a professional profile by its own ID */
  findById(id: number): Promise<Professional | null>;

  /** Find a professional profile by the owning user's ID */
  findByUserId(userId: number): Promise<Professional | null>;

  /** Update a professional profile by its own ID */
  update(id: number, data: UpdateProfessionalData): Promise<Professional>;
}
