import { RoleCache, UpsertRoleCacheData } from "../entities/role-cache.entity";

export interface IRoleCacheRepository {
  upsert(data: UpsertRoleCacheData): Promise<RoleCache>;
  findById(id: number): Promise<RoleCache | null>;
  findByName(name: string): Promise<RoleCache | null>;
  findAll(): Promise<RoleCache[]>;
  count(): Promise<number>;
}
