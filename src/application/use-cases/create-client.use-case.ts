import { User, RegisterUserData } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { RoleId } from "../../config/roles";

/**
 * Use case: Register a new client user.
 * Automatically assigns the client role.
 */
export class CreateClientUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Registers a client user with the configured client role ID.
   * @param data - Registration data (without roleId)
   * @returns The newly created client user
   */
  async execute(data: RegisterUserData): Promise<User> {
    return this.userRepository.create({ ...data, roleId: RoleId.CLIENT });
  }
}
