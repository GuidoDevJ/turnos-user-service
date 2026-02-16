import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { validate } from "../middlewares/validate.middleware";
import { firebaseAuth } from "../middlewares/firebase-auth.middleware";
import {
  createUserSchema,
  registerUserSchema,
  updateUserSchema,
  paginationSchema,
  idParamSchema,
  emailParamSchema,
} from "../validators/user.validator";

/**
 * Creates the user router with all CRUD endpoints.
 * @param controller - The UserController instance (already wired to use cases)
 * @returns Express Router
 */
export function createUserRouter(controller: UserController): Router {
  const router = Router();

  // All user routes require Firebase authentication
  router.use(firebaseAuth);

  /**
   * @openapi
   * /api/users:
   *   post:
   *     tags: [Users]
   *     summary: Create a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserInput'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict - duplicate email, username, or firebase UID
   */
  router.post("/", validate(createUserSchema, "body"), controller.create);

  /**
   * @openapi
   * /api/users/client:
   *   post:
   *     tags: [Users]
   *     summary: Register a new client user
   *     description: Creates a user with the "user" role automatically assigned
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterUserInput'
   *     responses:
   *       201:
   *         description: Client user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict - duplicate email, username, or firebase UID
   */
  router.post(
    "/client",
    validate(registerUserSchema, "body"),
    controller.createClient
  );

  /**
   * @openapi
   * /api/users/professional:
   *   post:
   *     tags: [Users]
   *     summary: Register a new professional user
   *     description: Creates a user with the "professional" role automatically assigned
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterUserInput'
   *     responses:
   *       201:
   *         description: Professional user created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserResponse'
   *       400:
   *         description: Validation error
   *       409:
   *         description: Conflict - duplicate email, username, or firebase UID
   */
  router.post(
    "/professional",
    validate(registerUserSchema, "body"),
    controller.createProfessional
  );

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
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page (max 100)
   *     responses:
   *       200:
   *         description: Paginated list of users
   */
  router.get("/", validate(paginationSchema, "query"), controller.list);

  /**
   * @openapi
   * /api/users/email/{email}:
   *   get:
   *     tags: [Users]
   *     summary: Get a user by email
   *     parameters:
   *       - in: path
   *         name: email
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: User found
   *       404:
   *         description: User not found
   */
  router.get(
    "/email/:email",
    validate(emailParamSchema, "params"),
    controller.getByEmail
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
   *     responses:
   *       200:
   *         description: User found
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
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUserInput'
   *     responses:
   *       200:
   *         description: User updated
   *       404:
   *         description: User not found
   *       409:
   *         description: Conflict
   */
  router.put(
    "/:id",
    validate(idParamSchema, "params"),
    validate(updateUserSchema, "body"),
    controller.update
  );

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     tags: [Users]
   *     summary: Soft-delete a user (deactivate)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User deactivated
   *       404:
   *         description: User not found
   */
  router.delete(
    "/:id",
    validate(idParamSchema, "params"),
    controller.delete
  );

  return router;
}
