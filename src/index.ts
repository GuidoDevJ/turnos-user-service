import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import {
  SQSClient,
  CreateQueueCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteQueueCommand,
} from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma/client";

// ── Repositories ───────────────────────────────────────────────────────────────
import { PrismaUserRepository } from "./infrastructure/database/prisma/user.repository.impl";
import { PrismaClientRepository } from "./infrastructure/database/prisma/client.repository.impl";
import { PrismaProfessionalRepository } from "./infrastructure/database/prisma/professional.repository.impl";
import { PrismaRoleCacheRepository } from "./infrastructure/database/prisma/role-cache.repository.impl";

// ── Use cases: User ────────────────────────────────────────────────────────────
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "./application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { GetUserFullProfileUseCase } from "./application/use-cases/user/get-user-full-profile.use-case";
import { AssignUserRoleUseCase } from "./application/use-cases/user/assign-user-role.use-case";

// ── Use cases: Client & Professional ──────────────────────────────────────────
import { CreateClientUseCase } from "./application/use-cases/create-client.use-case";
import { GetClientUseCase } from "./application/use-cases/client/get-client.use-case";
import { UpdateClientUseCase } from "./application/use-cases/client/update-client.use-case";
import { CreateProfessionalUseCase } from "./application/use-cases/create-professional.use-case";
import { GetProfessionalUseCase } from "./application/use-cases/professional/get-professional.use-case";
import { UpdateProfessionalUseCase } from "./application/use-cases/professional/update-professional.use-case";

// ── Use cases: Role cache ──────────────────────────────────────────────────────
import { SyncRoleCacheUseCase } from "./application/use-cases/role/sync-role-cache.use-case";

// ── Controllers ────────────────────────────────────────────────────────────────
import { UserController } from "./infrastructure/http/controllers/user.controller";
import { AuthController } from "./infrastructure/http/controllers/auth.controller";
import { ClientController } from "./infrastructure/http/controllers/client.controller";
import { ProfessionalController } from "./infrastructure/http/controllers/professional.controller";

// ── Routes ─────────────────────────────────────────────────────────────────────
import { createUserRouter } from "./infrastructure/http/routes/user.routes";
import { createAuthRouter } from "./infrastructure/http/routes/auth.routes";
import { createClientRouter } from "./infrastructure/http/routes/client.routes";
import { createProfessionalRouter } from "./infrastructure/http/routes/professional.routes";

// ── Middlewares ────────────────────────────────────────────────────────────────
import { errorHandler } from "./infrastructure/http/middlewares/error-handler.middleware";
import { swaggerSpec } from "./infrastructure/http/swagger";

// ── SQS Messaging ──────────────────────────────────────────────────────────────
import { createSqsClient } from "./infrastructure/messaging/sqs/sqs.client";
import { SqsConsumer } from "./infrastructure/messaging/sqs/sqs.consumer";
import { SqsPublisher } from "./infrastructure/messaging/sqs/sqs.publisher";
import { UserProfileRequestedHandler } from "./infrastructure/messaging/sqs/handlers/user-profile-requested.handler";
import { RoleEventHandler } from "./infrastructure/messaging/sqs/handlers/role-event.handler";
import {
  buildHandlerRegistry,
  buildRoleEventsHandlerRegistry,
} from "./infrastructure/messaging/sqs/handlers/index";

/**
 * FASE 4 — Startup roles-cache warm-up.
 * Sends ROLES_SYNC_REQUESTED via SQS and waits up to 30s for ROLES_SYNC_RESOLVED.
 * Uses a temporary reply queue; falls back gracefully to env-var constants if unavailable.
 */
async function warmRolesCache(
  sqsClient: SQSClient,
  publisher: SqsPublisher,
  syncUseCase: SyncRoleCacheUseCase,
  roleCacheRepo: PrismaRoleCacheRepository
): Promise<void> {
  const count = await roleCacheRepo.count();
  if (count > 0) {
    console.log(`[RolesCache] ${count} role(s) cached — skipping sync`);
    return;
  }

  if (!env.sqs.rolesSyncRequestQueueUrl) {
    console.warn("[RolesCache] SQS_ROLES_SYNC_REQUEST_QUEUE_URL not set — using hardcoded RoleId fallback");
    return;
  }

  console.log("[RolesCache] Cache empty — requesting sync from role-service...");
  const correlationId = randomUUID();
  const replyQueueName = `roles-sync-reply-${correlationId.slice(0, 8)}`;
  const createRes = await sqsClient.send(new CreateQueueCommand({ QueueName: replyQueueName }));
  const replyQueueUrl = createRes.QueueUrl!;

  try {
    await publisher.publish(env.sqs.rolesSyncRequestQueueUrl, {
      eventType: "ROLES_SYNC_REQUESTED",
      correlationId,
      replyQueueUrl,
    });

    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const res = await sqsClient.send(
        new ReceiveMessageCommand({ QueueUrl: replyQueueUrl, MaxNumberOfMessages: 1, WaitTimeSeconds: 5 })
      );
      const msg = res.Messages?.[0];
      if (!msg?.Body) continue;

      const envelope = JSON.parse(msg.Body);
      if (envelope.eventType === "ROLES_SYNC_RESOLVED" && envelope.correlationId === correlationId) {
        await syncUseCase.executeBatch(envelope.payload);
        await sqsClient.send(
          new DeleteMessageCommand({ QueueUrl: replyQueueUrl, ReceiptHandle: msg.ReceiptHandle! })
        );
        return;
      }
    }
    console.warn("[RolesCache] Sync timed out — using hardcoded RoleId fallback");
  } finally {
    await sqsClient.send(new DeleteQueueCommand({ QueueUrl: replyQueueUrl })).catch(() => {});
  }
}

async function bootstrap(): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ── Repositories ───────────────────────────────────────────────────────────
  const userRepository = new PrismaUserRepository(prisma);
  const clientRepository = new PrismaClientRepository(prisma);
  const professionalRepository = new PrismaProfessionalRepository(prisma);
  const roleCacheRepository = new PrismaRoleCacheRepository(prisma);

  // ── SQS client (only if at least one queue URL is configured) ─────────────
  const sqsEnabled = Boolean(
    env.sqs.requestQueueUrl || env.sqs.roleEventsQueueUrl || env.sqs.rolesSyncRequestQueueUrl
  );
  const sqsClient = sqsEnabled ? createSqsClient() : null;
  const sqsPublisher = sqsClient ? new SqsPublisher(sqsClient) : null;

  // ── Role cache warm-up ─────────────────────────────────────────────────────
  const syncRoleCacheUseCase = new SyncRoleCacheUseCase(roleCacheRepository);
  if (sqsClient && sqsPublisher) {
    await warmRolesCache(sqsClient, sqsPublisher, syncRoleCacheUseCase, roleCacheRepository).catch(
      (err) => console.error("[RolesCache] Warm-up error:", err)
    );
  }

  // ── Use cases ──────────────────────────────────────────────────────────────
  const getUserFullProfileUseCase = new GetUserFullProfileUseCase(
    userRepository, clientRepository, professionalRepository, roleCacheRepository
  );
  const createClientUseCase = new CreateClientUseCase(
    userRepository, clientRepository, roleCacheRepository
  );
  const createProfessionalUseCase = new CreateProfessionalUseCase(
    userRepository, professionalRepository, roleCacheRepository
  );
  const assignUserRoleUseCase = new AssignUserRoleUseCase(
    userRepository, clientRepository, professionalRepository, roleCacheRepository, sqsPublisher
  );

  // ── Controllers ───────────────────────────────────────────────────────────
  const userController = new UserController(
    new CreateUserUseCase(userRepository),
    createClientUseCase,
    createProfessionalUseCase,
    new GetUserUseCase(userRepository),
    new GetUserByEmailUseCase(userRepository),
    new ListUsersUseCase(userRepository),
    new UpdateUserUseCase(userRepository),
    new DeleteUserUseCase(userRepository),
    getUserFullProfileUseCase,
    assignUserRoleUseCase
  );
  const clientController = new ClientController(
    new GetClientUseCase(clientRepository),
    new UpdateClientUseCase(clientRepository)
  );
  const professionalController = new ProfessionalController(
    new GetProfessionalUseCase(professionalRepository),
    new UpdateProfessionalUseCase(professionalRepository)
  );

  // ── Routes ─────────────────────────────────────────────────────────────────
  app.use("/api/auth", createAuthRouter(new AuthController()));
  app.use("/api/users", createUserRouter(userController));
  app.use("/api/clients", createClientRouter(clientController));
  app.use("/api/professionals", createProfessionalRouter(professionalController));
  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[UserService] Running on port ${env.port}`);
    console.log(`[UserService] Swagger at http://localhost:${env.port}/api-docs`);
  });

  // ── SQS Consumers ──────────────────────────────────────────────────────────
  if (!sqsClient || !sqsPublisher) {
    console.log("[SQS] No SQS endpoint configured — consumers skipped.");
    return;
  }

  const consumers: SqsConsumer[] = [];

  if (env.sqs.requestQueueUrl) {
    const c1 = new SqsConsumer(
      sqsClient,
      env.sqs.requestQueueUrl,
      buildHandlerRegistry({
        userProfileRequestedHandler: new UserProfileRequestedHandler(getUserFullProfileUseCase, sqsPublisher),
      })
    );
    c1.start().catch((err) => console.error("[Consumer:user-profile-requests] Fatal:", err));
    consumers.push(c1);
    console.log("[SQS] user-profile-requests consumer started");
  }

  if (env.sqs.roleEventsQueueUrl) {
    const c2 = new SqsConsumer(
      sqsClient,
      env.sqs.roleEventsQueueUrl,
      buildRoleEventsHandlerRegistry({ roleEventHandler: new RoleEventHandler(syncRoleCacheUseCase) })
    );
    c2.start().catch((err) => console.error("[Consumer:role-events] Fatal:", err));
    consumers.push(c2);
    console.log("[SQS] role-events consumer started");
  }

  const shutdown = (): void => {
    consumers.forEach((c) => c.stop());
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
