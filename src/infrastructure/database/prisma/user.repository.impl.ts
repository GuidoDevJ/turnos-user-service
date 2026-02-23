import { PrismaClient } from "../../../generated/prisma/client";
import { IUserRepository } from "../../../domain/repositories/user.repository";
import {
  User,
  CreateUserData,
  UpdateUserData,
  PaginationParams,
  PaginatedResult,
} from "../../../domain/entities/user.entity";
import { ConflictError } from "../../../domain/errors/domain.error";
import { p2002Field } from "./prisma-error.helper";

/**
 * Prisma-based implementation of the IUserRepository port.
 * Adapts Prisma operations to the domain contract.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error: any) {
      if (error.code === "P2002") {
        const field = p2002Field(error.meta) ?? "field";
        throw new ConflictError(`A user with this ${field} already exists`);
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** @inheritdoc */
  async findByFirebaseUid(uid: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { firebaseUid: uid } });
  }

  /** @inheritdoc */
  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** @inheritdoc */
  async update(id: number, data: UpdateUserData): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error: any) {
      if (error.code === "P2002") {
        const field = p2002Field(error.meta) ?? "field";
        throw new ConflictError(`A user with this ${field} already exists`);
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async softDelete(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
