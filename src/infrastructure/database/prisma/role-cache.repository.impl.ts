import { PrismaClient } from "../../../generated/prisma/client";
import { IRoleCacheRepository } from "../../../domain/repositories/role-cache.repository";
import { RoleCache, UpsertRoleCacheData } from "../../../domain/entities/role-cache.entity";

export class PrismaRoleCacheRepository implements IRoleCacheRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(data: UpsertRoleCacheData): Promise<RoleCache> {
    return this.prisma.roleCache.upsert({
      where: { id: data.id },
      update: { name: data.name, isActive: data.isActive },
      create: { id: data.id, name: data.name, isActive: data.isActive },
    });
  }

  async findById(id: number): Promise<RoleCache | null> {
    return this.prisma.roleCache.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<RoleCache | null> {
    return this.prisma.roleCache.findUnique({ where: { name } });
  }

  async findAll(): Promise<RoleCache[]> {
    return this.prisma.roleCache.findMany({ orderBy: { id: "asc" } });
  }

  async count(): Promise<number> {
    return this.prisma.roleCache.count();
  }
}
