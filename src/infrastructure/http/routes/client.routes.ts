import { Router, RequestHandler } from "express";
import { ClientController } from "../controllers/client.controller";
import { validate } from "../middlewares/validate.middleware";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware";
import { idParamSchema } from "../validators/user.validator";
import { updateClientSchema } from "../validators/client.validator";

/**
 * Creates the client router with profile management endpoints.
 * @param controller - The ClientController instance (already wired to use cases)
 * @param authMiddleware - Auth middleware to apply. Defaults to firebaseAuth. Pass a no-op for tests.
 * @returns Express Router
 */
export function createClientRouter(
  controller: ClientController,
  authMiddleware: RequestHandler = firebaseAuth
): Router {
  const router = Router();

  router.use(authMiddleware);

  /**
   * @openapi
   * /api/clients/{id}:
   *   get:
   *     tags: [Clients]
   *     summary: Get a client profile by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Client profile found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ClientResponse'
   *       404:
   *         description: Client profile not found
   */
  router.get("/:id", validate(idParamSchema, "params"), controller.getById);

  /**
   * @openapi
   * /api/clients/{id}:
   *   put:
   *     tags: [Clients]
   *     summary: Update a client profile
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
   *             $ref: '#/components/schemas/UpdateClientInput'
   *     responses:
   *       200:
   *         description: Client profile updated
   *       404:
   *         description: Client profile not found
   */
  router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateClientSchema, "body"),
    controller.update
  );

  return router;
}
