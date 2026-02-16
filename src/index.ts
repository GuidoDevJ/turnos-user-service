import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { prisma } from "./infrastructure/database/prisma/client";
import { PrismaUserRepository } from "./infrastructure/database/prisma/user.repository.impl";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { CreateClientUseCase } from "./application/use-cases/create-client.use-case";
import { CreateProfessionalUseCase } from "./application/use-cases/create-professional.use-case";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "./application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "./application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { UserController } from "./infrastructure/http/controllers/user.controller";
import { createUserRouter } from "./infrastructure/http/routes/user.routes";
import { errorHandler } from "./infrastructure/http/middlewares/error-handler.middleware";
import { swaggerSpec } from "./infrastructure/http/swagger";

/** Composition root: wire all dependencies and start the server */
async function bootstrap(): Promise<void> {
  const app = express();

  // Global middlewares
  app.use(cors());
  app.use(express.json());

  // Swagger docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Dependency wiring
  const userRepository = new PrismaUserRepository(prisma);

  const createUserUseCase = new CreateUserUseCase(userRepository);
  const createClientUseCase = new CreateClientUseCase(userRepository);
  const createProfessionalUseCase = new CreateProfessionalUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);
  const getUserByEmailUseCase = new GetUserByEmailUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  const userController = new UserController(
    createUserUseCase,
    createClientUseCase,
    createProfessionalUseCase,
    getUserUseCase,
    getUserByEmailUseCase,
    listUsersUseCase,
    updateUserUseCase,
    deleteUserUseCase
  );

  // Routes
  app.use("/api/users", createUserRouter(userController));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Global error handler
  app.use(errorHandler);

  // Start server
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`Swagger docs at http://localhost:${env.port}/api-docs`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
