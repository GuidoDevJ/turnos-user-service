import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema } from "../validators/auth.validator";

/**
 * Creates the auth router.
 * These routes are intentionally public — no Firebase middleware applied.
 */
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/auth/token:
   *   post:
   *     tags: [Auth]
   *     summary: Get a Firebase ID token
   *     description: >
   *       Exchanges email/password credentials for a Firebase ID token.
   *       Use the returned `idToken` in the **Authorize** button above (format: `Bearer <idToken>`)
   *       to authenticate all protected endpoints.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginInput'
   *     security: []
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TokenResponse'
   *       400:
   *         description: Invalid credentials or missing fields
   */
  router.post("/token", validate(loginSchema, "body"), controller.login);

  return router;
}
