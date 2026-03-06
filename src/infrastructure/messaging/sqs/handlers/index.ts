import { IMessageHandler } from "../../ports/message-consumer.port";
import { UserProfileRequestedHandler } from "./user-profile-requested.handler";
import { RoleEventHandler } from "./role-event.handler";

export function buildHandlerRegistry(deps: {
  userProfileRequestedHandler: UserProfileRequestedHandler;
}): Map<string, IMessageHandler> {
  const registry = new Map<string, IMessageHandler>();
  registry.set(deps.userProfileRequestedHandler.eventType, deps.userProfileRequestedHandler);
  return registry;
}

export function buildRoleEventsHandlerRegistry(deps: {
  roleEventHandler: RoleEventHandler;
}): Map<string, IMessageHandler> {
  const registry = new Map<string, IMessageHandler>();
  registry.set("ROLE_CREATED", deps.roleEventHandler);
  registry.set("ROLE_UPDATED", deps.roleEventHandler);
  registry.set("ROLE_DELETED", deps.roleEventHandler);
  return registry;
}
