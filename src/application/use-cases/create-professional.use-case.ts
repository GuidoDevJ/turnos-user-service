import { IUserRepository } from "../../domain/repositories/user.repository";
import { IProfessionalRepository } from "../../domain/repositories/professional.repository";
import { IRoleCacheRepository } from "../../domain/repositories/role-cache.repository";
import { RegisterProfessionalData } from "../../domain/entities/professional.entity";
import { UserFullProfile } from "../../domain/entities/user-full-profile.entity";
import { RoleId } from "../../config/roles";
import { ConflictError } from "../../domain/errors/domain.error";

export class CreateProfessionalUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly professionalRepository: IProfessionalRepository,
    private readonly roleCacheRepository?: IRoleCacheRepository
  ) {}

  async execute(data: RegisterProfessionalData): Promise<UserFullProfile> {
    const { bio, specialization, licenseNumber, yearsExperience, ...userFields } = data;

    const professionalRole = await this.roleCacheRepository?.findByName("PROFESSIONAL");
    if (professionalRole && !professionalRole.isActive) {
      throw new ConflictError("PROFESSIONAL role is not currently active");
    }
    const roleId = professionalRole?.id ?? RoleId.PROFESSIONAL;

    const user = await this.userRepository.create({ ...userFields, roleId });
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
