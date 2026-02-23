import { Request, Response, NextFunction } from "express";
import { GetClientUseCase } from "../../../application/use-cases/client/get-client.use-case";
import { UpdateClientUseCase } from "../../../application/use-cases/client/update-client.use-case";

/**
 * HTTP controller for Client profile endpoints.
 * Delegates all business logic to the corresponding use cases.
 */
export class ClientController {
  constructor(
    private readonly getClientUseCase: GetClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase
  ) {}

  /**
   * GET /api/clients/:id
   * Returns a client profile by its own ID.
   */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const client = await this.getClientUseCase.execute(Number(req.params.id));
      res.json({ status: "success", data: client });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/clients/:id
   * Updates a client profile.
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const client = await this.updateClientUseCase.execute(
        Number(req.params.id),
        req.body
      );
      res.json({ status: "success", data: client });
    } catch (error) {
      next(error);
    }
  };
}
