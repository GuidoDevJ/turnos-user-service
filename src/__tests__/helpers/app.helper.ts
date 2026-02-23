import express, { Application, RequestHandler } from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { PrismaUserRepository } from "../../infrastructure/database/prisma/user.repository.impl";
import { PrismaClientRepository } from "../../infrastructure/database/prisma/client.repository.impl";
import { PrismaProfessionalRepository } from "../../infrastructure/database/prisma/professional.repository.impl";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetUserUseCase } from "../../application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "../../application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import { GetUserFullProfileUseCase } from "../../application/use-cases/user/get-user-full-profile.use-case";
import { CreateClientUseCase } from "../../application/use-cases/create-client.use-case";
import { GetClientUseCase } from "../../application/use-cases/client/get-client.use-case";
import { UpdateClientUseCase } from "../../application/use-cases/client/update-client.use-case";
import { CreateProfessionalUseCase } from "../../application/use-cases/create-professional.use-case";
import { GetProfessionalUseCase } from "../../application/use-cases/professional/get-professional.use-case";
import { UpdateProfessionalUseCase } from "../../application/use-cases/professional/update-professional.use-case";
import { UserController } from "../../infrastructure/http/controllers/user.controller";
import { ClientController } from "../../infrastructure/http/controllers/client.controller";
import { ProfessionalController } from "../../infrastructure/http/controllers/professional.controller";
import { createUserRouter } from "../../infrastructure/http/routes/user.routes";
import { createClientRouter } from "../../infrastructure/http/routes/client.routes";
import { createProfessionalRouter } from "../../infrastructure/http/routes/professional.routes";
import { errorHandler } from "../../infrastructure/http/middlewares/error-handler.middleware";

/**
 * Creates a properly-configured PrismaClient for tests.
 * Mirrors the production setup in infrastructure/database/prisma/client.ts.
 */
export function createTestPrismaClient(): PrismaClient {
  const pool = new pg.Pool({ connectionString: env.databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** No-op middleware used to bypass Firebase auth in tests */
const noAuth: RequestHandler = (_req, _res, next) => next();

/**
 * Builds a fully-wired Express app for integration tests.
 * Firebase auth is bypassed via a no-op middleware injected into each router.
 * @param prisma - A properly-initialized PrismaClient (use createTestPrismaClient)
 */
export function buildTestApp(prisma: PrismaClient): Application {
  const app = express();
  app.use(express.json());

  const userRepo = new PrismaUserRepository(prisma);
  const clientRepo = new PrismaClientRepository(prisma);
  const professionalRepo = new PrismaProfessionalRepository(prisma);

  const getUserFullProfile = new GetUserFullProfileUseCase(
    userRepo,
    clientRepo,
    professionalRepo
  );

  const userController = new UserController(
    new CreateUserUseCase(userRepo),
    new CreateClientUseCase(userRepo, clientRepo),
    new CreateProfessionalUseCase(userRepo, professionalRepo),
    new GetUserUseCase(userRepo),
    new GetUserByEmailUseCase(userRepo),
    new ListUsersUseCase(userRepo),
    new UpdateUserUseCase(userRepo),
    new DeleteUserUseCase(userRepo),
    getUserFullProfile
  );

  const clientController = new ClientController(
    new GetClientUseCase(clientRepo),
    new UpdateClientUseCase(clientRepo)
  );

  const professionalController = new ProfessionalController(
    new GetProfessionalUseCase(professionalRepo),
    new UpdateProfessionalUseCase(professionalRepo)
  );

  app.use("/api/users", createUserRouter(userController, noAuth));
  app.use("/api/clients", createClientRouter(clientController, noAuth));
  app.use("/api/professionals", createProfessionalRouter(professionalController, noAuth));
  app.use(errorHandler);

  return app;
}
