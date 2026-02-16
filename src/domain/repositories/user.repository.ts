import {
  User,
  CreateUserData,
  UpdateUserData,
  PaginationParams,
  PaginatedResult,
} from "../entities/user.entity";

/**
 * Port: User repository interface.
 * Defines the contract that any persistence adapter must implement.
 */
export interface IUserRepository {
  /** Create a new user */
  create(data: CreateUserData): Promise<User>;

  /** Find a user by their numeric ID */
  findById(id: number): Promise<User | null>;

  /** Find a user by their email address */
  findByEmail(email: string): Promise<User | null>;

  /** Find a user by their Firebase UID */
  findByFirebaseUid(uid: string): Promise<User | null>;

  /** List users with pagination */
  findAll(params: PaginationParams): Promise<PaginatedResult<User>>;

  /** Update a user by ID */
  update(id: number, data: UpdateUserData): Promise<User>;

  /** Soft delete a user (set is_active = false) */
  softDelete(id: number): Promise<User>;
}
