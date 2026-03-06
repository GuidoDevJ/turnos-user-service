import { IUserRepository } from "../../domain/repositories/user.repository";
import { IClientRepository } from "../../domain/repositories/client.repository";
import { IRoleCacheRepository } from "../../domain/repositories/role-cache.repository";
import { RegisterClientData } from "../../domain/entities/client.entity";
import { UserFullProfile } from "../../domain/entities/user-full-profile.entity";
import { RoleId } from "../../config/roles";
import { ConflictError } from "../../domain/errors/domain.error";

export class CreateClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository,
    private readonly roleCacheRepository?: IRoleCacheRepository
  ) {}

  async execute(data: RegisterClientData): Promise<UserFullProfile> {
    const { preferredPaymentMethod, notes, ...userFields } = data;

    // Resolve roleId dynamically; fall back to env-var constant
    const clientRole = await this.roleCacheRepository?.findByName("CLIENT");
    if (clientRole && !clientRole.isActive) {
      throw new ConflictError("CLIENT role is not currently active");
    }
    const roleId = clientRole?.id ?? RoleId.CLIENT;

    const user = await this.userRepository.create({ ...userFields, roleId });
    const client = await this.clientRepository.create({ userId: user.id, preferredPaymentMethod, notes });
    return { user, profile: client, profileType: "CLIENT" };
  }
}
