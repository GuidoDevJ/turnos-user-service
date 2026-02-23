import { Request, Response, NextFunction } from "express";
import { GetProfessionalUseCase } from "../../../application/use-cases/professional/get-professional.use-case";
import { UpdateProfessionalUseCase } from "../../../application/use-cases/professional/update-professional.use-case";

/**
 * HTTP controller for Professional profile endpoints.
 * Delegates all business logic to the corresponding use cases.
 */
export class ProfessionalController {
  constructor(
    private readonly getProfessionalUseCase: GetProfessionalUseCase,
    private readonly updateProfessionalUseCase: UpdateProfessionalUseCase
  ) {}

  /**
   * GET /api/professionals/:id
   * Returns a professional profile by its own ID.
   */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const professional = await this.getProfessionalUseCase.execute(
        Number(req.params.id)
      );
      res.json({ status: "success", data: professional });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/professionals/:id
   * Updates a professional profile.
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const professional = await this.updateProfessionalUseCase.execute(
        Number(req.params.id),
        req.body
      );
      res.json({ status: "success", data: professional });
    } catch (error) {
      next(error);
    }
  };
}
