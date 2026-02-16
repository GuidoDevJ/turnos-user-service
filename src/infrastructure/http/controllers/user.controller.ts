import { Request, Response, NextFunction } from "express";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { CreateClientUseCase } from "../../../application/use-cases/create-client.use-case";
import { CreateProfessionalUseCase } from "../../../application/use-cases/create-professional.use-case";
import { GetUserUseCase } from "../../../application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "../../../application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "../../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../../application/use-cases/delete-user.use-case";

/**
 * HTTP controller for User endpoints.
 * Delegates all business logic to the corresponding use cases.
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly createProfessionalUseCase: CreateProfessionalUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  /**
   * POST /api/users
   * Creates a new user.
   */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/client
   * Registers a new client user (role assigned automatically).
   */
  createClient = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.createClientUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/professional
   * Registers a new professional user (role assigned automatically).
   */
  createProfessional = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.createProfessionalUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/:id
   * Returns a user by ID.
   */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.getUserUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/email/:email
   * Returns a user by email address.
   */
  getByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.getUserByEmailUseCase.execute(
        req.params.email as string
      );
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users
   * Lists users with pagination.
   */
  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as {
        page: number;
        limit: number;
      };
      const result = await this.listUsersUseCase.execute({ page, limit });
      res.json({ status: "success", ...result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/users/:id
   * Updates a user.
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.updateUserUseCase.execute(
        Number(req.params.id),
        req.body
      );
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/users/:id
   * Soft-deletes a user (sets is_active = false).
   */
  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.deleteUserUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: user });
    } catch (error) {
      next(error);
    }
  };
}
