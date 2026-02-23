import { Router, RequestHandler } from "express";
import { ProfessionalController } from "../controllers/professional.controller";
import { validate } from "../middlewares/validate.middleware";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware";
import { idParamSchema } from "../validators/user.validator";
import { updateProfessionalSchema } from "../validators/professional.validator";

/**
 * Creates the professional router with profile management endpoints.
 * @param controller - The ProfessionalController instance (already wired to use cases)
 * @param authMiddleware - Auth middleware to apply. Defaults to firebaseAuth. Pass a no-op for tests.
 * @returns Express Router
 */
export function createProfessionalRouter(
  controller: ProfessionalController,
  authMiddleware: RequestHandler = firebaseAuth
): Router {
  const router = Router();

  router.use(authMiddleware);

  /**
   * @openapi
   * /api/professionals/{id}:
   *   get:
   *     tags: [Professionals]
   *     summary: Get a professional profile by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Professional profile found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ProfessionalResponse'
   *       404:
   *         description: Professional profile not found
   */
  router.get("/:id", validate(idParamSchema, "params"), controller.getById);

  /**
   * @openapi
   * /api/professionals/{id}:
   *   put:
   *     tags: [Professionals]
   *     summary: Update a professional profile
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateProfessionalInput'
   *     responses:
   *       200:
   *         description: Professional profile updated
   *       404:
   *         description: Professional profile not found
   *       409:
   *         description: Conflict - duplicate license number
   */
  router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateProfessionalSchema, "body"),
    controller.update
  );

  return router;
}
