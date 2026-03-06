import { Router, RequestHandler } from "express";
import { UserController } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware";
import {
  createUserSchema,
  updateUserSchema,
  paginationSchema,
  idParamSchema,
  emailParamSchema,
  assignRoleSchema,
} from "../validators/user.validator";
import { registerClientSchema } from "../validators/client.validator";
import { registerProfessionalSchema } from "../validators/professional.validator";

export function createUserRouter(
  controller: UserController,
  authMiddleware: RequestHandler = firebaseAuth
): Router {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", validate(createUserSchema, "body"), controller.create);
  router.post("/client", validate(registerClientSchema, "body"), controller.createClient);
  router.post("/professional", validate(registerProfessionalSchema, "body"), controller.createProfessional);

  router.get("/", validate(paginationSchema, "query"), controller.list);
  router.get("/email/:email", validate(emailParamSchema, "params"), controller.getByEmail);

  // Static sub-paths before /:id to avoid shadowing
  router.get("/:id/profile", validate(idParamSchema, "params"), controller.getFullProfile);

  /**
   * @openapi
   * /api/users/{id}/assign-role:
   *   post:
   *     tags: [Users]
   *     summary: Assign or transition a user to CLIENT or PROFESSIONAL role
   *     description: |
   *       Updates the user's roleId and creates the associated profile
   *       (Client or Professional) if it does not already exist.
   *       Publishes a USER_ROLE_ASSIGNED event to the user-events queue.
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
   *             type: object
   *             required: [role]
   *             properties:
   *               role:
   *                 type: string
   *                 enum: [CLIENT, PROFESSIONAL]
   *               preferredPaymentMethod:
   *                 type: string
   *               notes:
   *                 type: string
   *               bio:
   *                 type: string
   *               specialization:
   *                 type: string
   *               licenseNumber:
   *                 type: string
   *               yearsExperience:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Role assigned — full profile returned
   *       404:
   *         description: User not found
   *       409:
   *         description: User already has this role, or role is inactive
   */
  router.post(
    "/:id/assign-role",
    validate(idParamSchema, "params"),
    validate(assignRoleSchema, "body"),
    controller.assignRole
  );

  router.get("/:id", validate(idParamSchema, "params"), controller.getById);
  router.put("/:id", validate(idParamSchema, "params"), validate(updateUserSchema, "body"), controller.update);
  router.delete("/:id", validate(idParamSchema, "params"), controller.delete);

  return router;
}
