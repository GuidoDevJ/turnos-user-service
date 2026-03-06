import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import { IRoleCacheRepository } from "../../../domain/repositories/role-cache.repository";
import { UserFullProfile } from "../../../domain/entities/user-full-profile.entity";
import { NotFoundError } from "../../../domain/errors/domain.error";
import { RoleId } from "../../../config/roles";

export class GetUserFullProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository,
    private readonly professionalRepository: IProfessionalRepository,
    private readonly roleCacheRepository?: IRoleCacheRepository
  ) {}

  async execute(userId: number): Promise<UserFullProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    // Dynamic lookup with env-var fallback
    const clientRoleId =
      (await this.roleCacheRepository?.findByName("CLIENT"))?.id ?? RoleId.CLIENT;
    const professionalRoleId =
      (await this.roleCacheRepository?.findByName("PROFESSIONAL"))?.id ?? RoleId.PROFESSIONAL;

    if (user.roleId === clientRoleId) {
      const client = await this.clientRepository.findByUserId(userId);
      return { user, profile: client, profileType: client ? "CLIENT" : null };
    }

    if (user.roleId === professionalRoleId) {
      const professional = await this.professionalRepository.findByUserId(userId);
      return { user, profile: professional, profileType: professional ? "PROFESSIONAL" : null };
    }

    return { user, profile: null, profileType: null };
  }
}
