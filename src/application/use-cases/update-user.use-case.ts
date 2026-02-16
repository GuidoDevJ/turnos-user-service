import { User, UpdateUserData } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { NotFoundError } from "../../domain/errors/domain.error";

/**
 * Use case: Update an existing user.
 */
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Updates a user's data.
   * @param id - The user's ID
   * @param data - Fields to update
   * @returns The updated user
   * @throws NotFoundError when the user does not exist
   */
  async execute(id: number, data: UpdateUserData): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User", id);
    }
    return this.userRepository.update(id, data);
  }
}
