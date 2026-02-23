import {
  Professional,
  UpdateProfessionalData,
} from "../../../domain/entities/professional.entity";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import { NotFoundError } from "../../../domain/errors/domain.error";

/**
 * Use case: Update a professional profile.
 */
export class UpdateProfessionalUseCase {
  constructor(
    private readonly professionalRepository: IProfessionalRepository
  ) {}

  /**
   * Updates an existing professional profile.
   * @param id - The professional profile's ID
   * @param data - Fields to update
   * @returns The updated professional profile
   * @throws NotFoundError when the professional profile does not exist
   */
  async execute(id: number, data: UpdateProfessionalData): Promise<Professional> {
    const existing = await this.professionalRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Professional", id);
    }
    return this.professionalRepository.update(id, data);
  }
}
