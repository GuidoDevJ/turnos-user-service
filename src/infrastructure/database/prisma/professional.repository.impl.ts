import { PrismaClient } from "../../../generated/prisma/client";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import {
  Professional,
  CreateProfessionalData,
  UpdateProfessionalData,
} from "../../../domain/entities/professional.entity";
import { ConflictError } from "../../../domain/errors/domain.error";
import { p2002Field } from "./prisma-error.helper";

/**
 * Prisma-based implementation of the IProfessionalRepository port.
 * Adapts Prisma operations to the domain contract.
 */
export class PrismaProfessionalRepository implements IProfessionalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(data: CreateProfessionalData): Promise<Professional> {
    try {
      return await this.prisma.professional.create({ data });
    } catch (error: any) {
      if (error.code === "P2002") {
        const field = p2002Field(error.meta);
        if (!field || field === "user_id") {
          throw new ConflictError(
            "A professional profile for this user already exists"
          );
        }
        throw new ConflictError(
          `A professional with this ${field} already exists`
        );
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Professional | null> {
    return this.prisma.professional.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async findByUserId(userId: number): Promise<Professional | null> {
    return this.prisma.professional.findUnique({ where: { userId } });
  }

  /** @inheritdoc */
  async update(id: number, data: UpdateProfessionalData): Promise<Professional> {
    try {
      return await this.prisma.professional.update({ where: { id }, data });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError(
          "A professional with this license number already exists"
        );
      }
      throw error;
    }
  }
}
