import { IRoleCacheRepository } from "../../../domain/repositories/role-cache.repository";
import { UpsertRoleCacheData } from "../../../domain/entities/role-cache.entity";

export class SyncRoleCacheUseCase {
  constructor(private readonly roleCacheRepository: IRoleCacheRepository) {}

  async execute(role: UpsertRoleCacheData): Promise<void> {
    await this.roleCacheRepository.upsert(role);
  }

  async executeBatch(roles: UpsertRoleCacheData[]): Promise<void> {
    for (const role of roles) {
      await this.roleCacheRepository.upsert(role);
    }
    console.log(`[RolesCache] Synced ${roles.length} roles`);
  }
}
