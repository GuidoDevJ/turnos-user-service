import { User, RegisterUserData } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { RoleId } from "../../config/roles";

/**
 * Use case: Register a new professional user.
 * Automatically assigns the professional role.
 */
export class CreateProfessionalUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Registers a professional user with the configured professional role ID.
   * @param data - Registration data (without roleId)
   * @returns The newly created professional user
   */
  async execute(data: RegisterUserData): Promise<User> {
    return this.userRepository.create({
      ...data,
      roleId: RoleId.PROFESSIONAL,
    });
  }
}
