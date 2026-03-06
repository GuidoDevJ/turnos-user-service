export interface RoleCache {
  id: number;
  name: string;
  isActive: boolean;
  syncedAt: Date;
}

export interface UpsertRoleCacheData {
  id: number;
  name: string;
  isActive: boolean;
}
