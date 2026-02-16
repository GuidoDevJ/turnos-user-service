import { User } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { NotFoundError } from "../../domain/errors/domain.error";

/**
 * Use case: Retrieve a single user by their ID.
 */
export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Finds a user by numeric ID.
   * @param id - The user's ID
   * @returns The found user
   * @throws NotFoundError when the user does not exist
   */
  async execute(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User", id);
    }
    return user;
  }
}
