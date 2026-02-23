import { IUserRepository } from "../../domain/repositories/user.repository";
import { IProfessionalRepository } from "../../domain/repositories/professional.repository";
import { RegisterProfessionalData } from "../../domain/entities/professional.entity";
import { UserFullProfile } from "../../domain/entities/user-full-profile.entity";
import { RoleId } from "../../config/roles";

/**
 * Use case: Register a new professional.
 * Creates the base User record and the associated Professional profile in a single operation.
 */
export class CreateProfessionalUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly professionalRepository: IProfessionalRepository
  ) {}

  /**
   * Registers a new professional by creating both the user and professional profile.
   * @param data - Registration data including user fields and optional professional-specific fields
   * @returns The full professional profile (user + professional extension)
   */
  async execute(data: RegisterProfessionalData): Promise<UserFullProfile> {
    const { bio, specialization, licenseNumber, yearsExperience, ...userFields } =
      data;

    const user = await this.userRepository.create({
      ...userFields,
      roleId: RoleId.PROFESSIONAL,
    });

    const professional = await this.professionalRepository.create({
      userId: user.id,
      bio,
      specialization,
      licenseNumber,
      yearsExperience,
    });

    return { user, profile: professional, profileType: "PROFESSIONAL" };
  }
}
