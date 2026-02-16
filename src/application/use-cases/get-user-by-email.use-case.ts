import { User } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";
import { NotFoundError } from "../../domain/errors/domain.error";

/**
 * Use case: Retrieve a user by their email address.
 */
export class GetUserByEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Finds a user by email.
   * @param email - The user's email
   * @returns The found user
   * @throws NotFoundError when no user with that email exists
   */
  async execute(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User", email);
    }
    return user;
  }
}
