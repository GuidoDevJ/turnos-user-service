import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import { UserFullProfile } from "../../../domain/entities/user-full-profile.entity";
import { NotFoundError } from "../../../domain/errors/domain.error";
import { RoleId } from "../../../config/roles";

/**
 * Use case: Retrieve a full user profile (user + client or professional extension).
 * Determines the profile type from the user's roleId and fetches the corresponding extension.
 */
export class GetUserFullProfileUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository,
    private readonly professionalRepository: IProfessionalRepository
  ) {}

  /**
   * Fetches the complete profile for a given user ID.
   * @param userId - The user's ID
   * @returns UserFullProfile containing the user, their extension, and the profile type
   * @throws NotFoundError when the user does not exist
   */
  async execute(userId: number): Promise<UserFullProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    if (user.roleId === RoleId.CLIENT) {
      const client = await this.clientRepository.findByUserId(userId);
      return { user, profile: client, profileType: client ? "CLIENT" : null };
    }

    if (user.roleId === RoleId.PROFESSIONAL) {
      const professional = await this.professionalRepository.findByUserId(userId);
      return {
        user,
        profile: professional,
        profileType: professional ? "PROFESSIONAL" : null,
      };
    }

    return { user, profile: null, profileType: null };
  }
}
