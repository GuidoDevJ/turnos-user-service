import { PrismaClient } from "../../../generated/prisma/client";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import {
  Client,
  CreateClientData,
  UpdateClientData,
} from "../../../domain/entities/client.entity";
import { ConflictError } from "../../../domain/errors/domain.error";

/**
 * Prisma-based implementation of the IClientRepository port.
 * Adapts Prisma operations to the domain contract.
 */
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** @inheritdoc */
  async create(data: CreateClientData): Promise<Client> {
    try {
      return await this.prisma.client.create({ data });
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("A client profile for this user already exists");
      }
      throw error;
    }
  }

  /** @inheritdoc */
  async findById(id: number): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }

  /** @inheritdoc */
  async findByUserId(userId: number): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { userId } });
  }

  /** @inheritdoc */
  async update(id: number, data: UpdateClientData): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }
}
