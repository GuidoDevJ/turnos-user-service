import {
  User,
  PaginationParams,
  PaginatedResult,
} from "../../domain/entities/user.entity";
import { IUserRepository } from "../../domain/repositories/user.repository";

/**
 * Use case: List all users with pagination.
 */
export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Lists users with pagination support.
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of users
   */
  async execute(params: PaginationParams): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(params);
  }
}
