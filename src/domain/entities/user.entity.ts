/**
 * Represents the User domain entity.
 * Pure domain object with no external dependencies.
 */
export interface User {
  id: number;
  firebaseUid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  roleId: number;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Data required to create a new user */
export interface CreateUserData {
  firebaseUid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  roleId: number;
}

/** Data for registering a user without specifying roleId (resolved by use case) */
export interface RegisterUserData {
  firebaseUid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

/** Data allowed when updating a user */
export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
  roleId?: number;
  isActive?: boolean;
  isVerified?: boolean;
  emailVerifiedAt?: Date | null;
}

/** Pagination parameters for listing users */
export interface PaginationParams {
  page: number;
  limit: number;
}

/** Paginated result wrapper */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
