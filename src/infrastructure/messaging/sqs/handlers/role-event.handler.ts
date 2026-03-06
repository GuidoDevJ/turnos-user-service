import { IMessageHandler } from "../../ports/message-consumer.port";
import { SyncRoleCacheUseCase } from "../../../../application/use-cases/role/sync-role-cache.use-case";

interface RoleEventPayload {
  eventType: "ROLE_CREATED" | "ROLE_UPDATED" | "ROLE_DELETED";
  payload: { id: number; name: string; isActive: boolean };
}

/**
 * Handles ROLE_CREATED, ROLE_UPDATED, and ROLE_DELETED events from role-service.
 * Upserts each change into the local roles_cache table.
 * Register this handler under all three event type keys in the handler registry.
 */
export class RoleEventHandler implements IMessageHandler {
  readonly eventType = "ROLE_CREATED"; // primary key; registry also registers ROLE_UPDATED / ROLE_DELETED

  constructor(private readonly syncRoleCacheUseCase: SyncRoleCacheUseCase) {}

  async handle(envelope: RoleEventPayload): Promise<void> {
    const { eventType, payload } = envelope;

    // For ROLE_DELETED: mark as inactive in cache (soft-delete mirror)
    const isActive = eventType === "ROLE_DELETED" ? false : payload.isActive;

    await this.syncRoleCacheUseCase.execute({ id: payload.id, name: payload.name, isActive });
    console.log(`[RoleEventHandler] ${eventType} → cached role id=${payload.id} name=${payload.name}`);
  }
}
