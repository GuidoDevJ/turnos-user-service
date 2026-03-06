import { Request, Response, NextFunction } from "express";
import { CreateUserUseCase } from "../../../application/use-cases/create-user.use-case";
import { CreateClientUseCase } from "../../../application/use-cases/create-client.use-case";
import { CreateProfessionalUseCase } from "../../../application/use-cases/create-professional.use-case";
import { GetUserUseCase } from "../../../application/use-cases/get-user.use-case";
import { GetUserByEmailUseCase } from "../../../application/use-cases/get-user-by-email.use-case";
import { ListUsersUseCase } from "../../../application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "../../../application/use-cases/update-user.use-case";
import { DeleteUserUseCase } from "../../../application/use-cases/delete-user.use-case";
import { GetUserFullProfileUseCase } from "../../../application/use-cases/user/get-user-full-profile.use-case";
import { AssignUserRoleUseCase } from "../../../application/use-cases/user/assign-user-role.use-case";

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly createProfessionalUseCase: CreateProfessionalUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserFullProfileUseCase: GetUserFullProfileUseCase,
    private readonly assignUserRoleUseCase: AssignUserRoleUseCase
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.createClientUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  createProfessional = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.createProfessionalUseCase.execute(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.getUserUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  getByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.getUserByEmailUseCase.execute(req.params.email as string);
      res.json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await this.listUsersUseCase.execute({ page, limit });
      res.json({ status: "success", ...result });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.updateUserUseCase.execute(Number(req.params.id), req.body);
      res.json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.deleteUserUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: user });
    } catch (error) { next(error); }
  };

  getFullProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this.getUserFullProfileUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: profile });
    } catch (error) { next(error); }
  };

  /** POST /api/users/:id/assign-role */
  assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role, ...profileData } = req.body;
      const result = await this.assignUserRoleUseCase.execute(
        Number(req.params.id),
        role,
        profileData
      );
      res.json({ status: "success", data: result });
    } catch (error) { next(error); }
  };
}
