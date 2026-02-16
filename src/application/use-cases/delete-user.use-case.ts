import { User } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { NotFoundError } from "../../domain/errors/domain.error";

/**
 * Use case: Soft-delete a user (deactivate).
 */
export class DeleteUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Soft-deletes a user by setting is_active to false.
   * @param id - The user's ID
   * @returns The deactivated user
   * @throws NotFoundError when the user does not exist
   */
  async execute(id: number): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User", id);
    }
    return this.userRepository.softDelete(id);
  }
}
