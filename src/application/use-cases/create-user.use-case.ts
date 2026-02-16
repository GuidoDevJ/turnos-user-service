import { User, CreateUserData } from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";

/**
 * Use case: Create a new user in the system.
 */
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Executes user creation.
   * @param data - The data needed to create a user
   * @returns The newly created user
   */
  async execute(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }
}
