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

  /**
   * @openapi
   * /api/users:
   *   post:
   *     tags: [Users]
   *     summary: Create a base user
   *     description: Creates a user with an explicit roleId. Use `/api/users/client` or `/api/users/professional` to register with a profile.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserInput'
   *     responses:
   *       201:
   *         description: User created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict — firebaseUid or email already exists
   */
  router.post("/", validate(createUserSchema, "body"), controller.create);

  /**
   * @openapi
   * /api/users/client:
   *   post:
   *     tags: [Users]
   *     summary: Register a user as a client
   *     description: Creates a user and a linked Client profile in a single operation.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterClientInput'
   *     responses:
   *       201:
   *         description: User and client profile created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict — firebaseUid or email already exists
   */
  router.post("/client", validate(registerClientSchema, "body"), controller.createClient);

  /**
   * @openapi
   * /api/users/professional:
   *   post:
   *     tags: [Users]
   *     summary: Register a user as a professional
   *     description: Creates a user and a linked Professional profile in a single operation.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterProfessionalInput'
   *     responses:
   *       201:
   *         description: User and professional profile created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict — firebaseUid, email or licenseNumber already exists
   */
  router.post("/professional", validate(registerProfessionalSchema, "body"), controller.createProfessional);

  /**
   * @openapi
   * /api/users:
   *   get:
   *     tags: [Users]
   *     summary: List users with pagination
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *           minimum: 1
   *           maximum: 100
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Paginated list of users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserListResponse'
   *       400:
   *         description: Validation error
   */
  router.get("/", validate(paginationSchema, "query"), controller.list);

  /**
   * @openapi
   * /api/users/{id}/profile:
   *   get:
   *     tags: [Users]
   *     summary: Get full user profile
   *     description: Returns the user along with their Client and/or Professional profile extensions.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: Full user profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserFullProfileResponse'
   *       404:
   *         description: User not found
   */
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
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AssignRoleInput'
   *     responses:
   *       200:
   *         description: Role assigned — full profile returned
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserFullProfileResponse'
   *       400:
   *         description: Validation error
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

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     tags: [Users]
   *     summary: Get a user by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       404:
   *         description: User not found
   */
  router.get("/:id", validate(idParamSchema, "params"), controller.getById);

  /**
   * @openapi
   * /api/users/{id}:
   *   put:
   *     tags: [Users]
   *     summary: Update a user
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserInput'
   *     responses:
   *       200:
   *         description: User updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       404:
   *         description: User not found
   *       409:
   *         description: Conflict — email already taken
   */
  router.put("/:id", validate(idParamSchema, "params"), validate(updateUserSchema, "body"), controller.update);

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Delete a user
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted — returns the deleted user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       404:
   *         description: User not found
   */
  router.delete("/:id", validate(idParamSchema, "params"), controller.delete);

  return router;
}
