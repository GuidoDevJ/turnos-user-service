import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma/client";

// ── Repositories ───────────────────────────────────────────────────────────────
import { PrismaUserRepository } from "./infrastructure/database/prisma/user.repository.impl";
import { PrismaClientRepository } from "./infrastructure/database/prisma/client.repository.impl";
import { PrismaProfessionalRepository } from "./infrastructure/database/prisma/professional.repository.impl";

// ── Use cases: User ─────────────────────────────────────────────────────────────
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "./application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { GetUserFullProfileUseCase } from "./application/use-cases/user/get-user-full-profile.use-case";

// ── Use cases: Client & Professional ───────────────────────────────────────────
import { CreateClientUseCase } from "./application/use-cases/create-client.use-case";
import { GetClientUseCase } from "./application/use-cases/client/get-client.use-case";
import { UpdateClientUseCase } from "./application/use-cases/client/update-client.use-case";
import { CreateProfessionalUseCase } from "./application/use-cases/create-professional.use-case";
import { GetProfessionalUseCase } from "./application/use-cases/professional/get-professional.use-case";
import { UpdateProfessionalUseCase } from "./application/use-cases/professional/update-professional.use-case";

// ── Controllers ─────────────────────────────────────────────────────────────────
import { UserController } from "./infrastructure/http/controllers/user.controller";
import { AuthController } from "./infrastructure/http/controllers/auth.controller";
import { ClientController } from "./infrastructure/http/controllers/client.controller";
import { ProfessionalController } from "./infrastructure/http/controllers/professional.controller";

// ── Routes ──────────────────────────────────────────────────────────────────────
import { createUserRouter } from "./infrastructure/http/routes/user.routes";
import { createAuthRouter } from "./infrastructure/http/routes/auth.routes";
import { createClientRouter } from "./infrastructure/http/routes/client.routes";
import { createProfessionalRouter } from "./infrastructure/http/routes/professional.routes";

// ── Middlewares ─────────────────────────────────────────────────────────────────
import { errorHandler } from "./infrastructure/http/middlewares/error-handler.middleware";
import { swaggerSpec } from "./infrastructure/http/swagger";

// ── SQS Messaging ───────────────────────────────────────────────────────────────
import { createSqsClient } from "./infrastructure/messaging/sqs/sqs.client";
import { SqsConsumer } from "./infrastructure/messaging/sqs/sqs.consumer";
import { SqsPublisher } from "./infrastructure/messaging/sqs/sqs.publisher";
import { UserProfileRequestedHandler } from "./infrastructure/messaging/sqs/handlers/user-profile-requested.handler";
import { buildHandlerRegistry } from "./infrastructure/messaging/sqs/handlers/index";

/** Composition root: wire all dependencies and start the server */
async function bootstrap(): Promise<void> {
  const app = express();

  // ── Global middlewares ────────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());

  // ── Swagger docs ──────────────────────────────────────────────────────────────
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ── Repository instances ──────────────────────────────────────────────────────
  const userRepository = new PrismaUserRepository(prisma);
  const clientRepository = new PrismaClientRepository(prisma);
  const professionalRepository = new PrismaProfessionalRepository(prisma);

  // ── Use case instances: User ──────────────────────────────────────────────────
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);
  const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);
  const getUserFullProfileUseCase = new GetUserFullProfileUseCase(
    userRepository,
    clientRepository,
    professionalRepository
  );

  // ── Use case instances: Client ────────────────────────────────────────────────
  const createClientUseCase = new CreateClientUseCase(
    userRepository,
    clientRepository
  );
  const getClientUseCase = new GetClientUseCase(clientRepository);
  const updateClientUseCase = new UpdateClientUseCase(clientRepository);

  // ── Use case instances: Professional ──────────────────────────────────────────
  const createProfessionalUseCase = new CreateProfessionalUseCase(
    userRepository,
    professionalRepository
  );
  const getProfessionalUseCase = new GetProfessionalUseCase(
    professionalRepository
  );
  const updateProfessionalUseCase = new UpdateProfessionalUseCase(
    professionalRepository
  );

  // ── Controller instances ──────────────────────────────────────────────────────
  const userController = new UserController(
    createUserUseCase,
    createClientUseCase,
    createProfessionalUseCase,
    getUserUseCase,
    getUserByEmailUseCase,
    listUsersUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    getUserFullProfileUseCase
  );

  const clientController = new ClientController(
    getClientUseCase,
    updateClientUseCase
  );

  const professionalController = new ProfessionalController(
    getProfessionalUseCase,
    updateProfessionalUseCase
  );

  // ── Routes ────────────────────────────────────────────────────────────────────
  app.use("/api/auth", createAuthRouter(new AuthController()));
  app.use("/api/users", createUserRouter(userController));
  app.use("/api/clients", createClientRouter(clientController));
  app.use("/api/professionals", createProfessionalRouter(professionalController));

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ── Global error handler ──────────────────────────────────────────────────────
  app.use(errorHandler);

  // ── HTTP server ───────────────────────────────────────────────────────────────
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`Swagger docs at http://localhost:${env.port}/api-docs`);
  });

  // ── SQS Consumer (only if queue URL is configured) ───────────────────────────
  if (env.sqs.requestQueueUrl) {
    const sqsClient = createSqsClient();
    const publisher = new SqsPublisher(sqsClient);

    const userProfileRequestedHandler = new UserProfileRequestedHandler(
      getUserFullProfileUseCase,
      publisher
    );

    const handlerRegistry = buildHandlerRegistry({ userProfileRequestedHandler });

    const consumer = new SqsConsumer(
      sqsClient,
      env.sqs.requestQueueUrl,
      handlerRegistry
    );

    // Run the consumer in the background without blocking the HTTP server
    consumer.start().catch((error) => {
      console.error("[SqsConsumer] Fatal error:", error);
    });

    // Graceful shutdown
    const shutdown = (): void => {
      consumer.stop();
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } else {
    console.log(
      "[SQS] SQS_REQUEST_QUEUE_URL not set — consumer will not start."
    );
  }
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
