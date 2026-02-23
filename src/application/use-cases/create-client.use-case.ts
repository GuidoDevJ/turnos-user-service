import { IUserRepository } from "../../domain/repositories/user.repository";
import { IClientRepository } from "../../domain/repositories/client.repository";
import { RegisterClientData } from "../../domain/entities/client.entity";
import { UserFullProfile } from "../../domain/entities/user-full-profile.entity";
import { RoleId } from "../../config/roles";

/**
 * Use case: Register a new client.
 * Creates the base User record and the associated Client profile in a single operation.
 */
export class CreateClientUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository
  ) {}

  /**
   * Registers a new client by creating both the user and client profile.
   * @param data - Registration data including user fields and optional client-specific fields
   * @returns The full client profile (user + client extension)
   */
  async execute(data: RegisterClientData): Promise<UserFullProfile> {
    const { preferredPaymentMethod, notes, ...userFields } = data;

    const user = await this.userRepository.create({
      ...userFields,
      roleId: RoleId.CLIENT,
    });

    const client = await this.clientRepository.create({
      userId: user.id,
      preferredPaymentMethod,
      notes,
    });

    return { user, profile: client, profileType: "CLIENT" };
  }
}
