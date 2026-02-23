import { IMessageHandler } from "../../ports/message-consumer.port";
import { UserProfileRequestedHandler } from "./user-profile-requested.handler";

/**
 * Registers all SQS handlers into a dispatch map keyed by eventType.
 * Add new handlers here as new event types are introduced.
 *
 * @param deps - All handler dependencies, injected from the composition root
 * @returns A Map<eventType, handler> ready to pass to SqsConsumer
 */
export function buildHandlerRegistry(deps: {
  userProfileRequestedHandler: UserProfileRequestedHandler;
}): Map<string, IMessageHandler> {
  const registry = new Map<string, IMessageHandler>();

  registry.set(
    deps.userProfileRequestedHandler.eventType,
    deps.userProfileRequestedHandler
  );

  return registry;
}
