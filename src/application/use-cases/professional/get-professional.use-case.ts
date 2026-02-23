import { Professional } from "../../../domain/entities/professional.entity";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import { NotFoundError } from "../../../domain/errors/domain.error";

/**
 * Use case: Retrieve a professional profile by its own ID.
 */
export class GetProfessionalUseCase {
  constructor(
    private readonly professionalRepository: IProfessionalRepository
  ) {}

  /**
   * Finds a professional profile by ID.
   * @param id - The professional profile's ID
   * @returns The found professional profile
   * @throws NotFoundError when the professional profile does not exist
   */
  async execute(id: number): Promise<Professional> {
    const professional = await this.professionalRepository.findById(id);
    if (!professional) {
      throw new NotFoundError("Professional", id);
    }
    return professional;
  }
}
