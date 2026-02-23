import { Request, Response, NextFunction } from "express";
import { env } from "../../../config/env";

const FIREBASE_SIGNIN_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

/**
 * Handles authentication-related endpoints.
 * Proxies Firebase Identity Toolkit to expose token retrieval via REST,
 * enabling direct usage from Swagger and API clients without a browser.
 */
export class AuthController {
  /**
   * POST /api/auth/token
   * Exchange email+password credentials for a Firebase ID token.
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      const firebaseRes = await fetch(
        `${FIREBASE_SIGNIN_URL}?key=${env.firebaseWebApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );

      const data = await firebaseRes.json() as Record<string, unknown>;

      if (!firebaseRes.ok) {
        const errorCode = (data.error as Record<string, unknown>)?.message ?? "UNKNOWN_ERROR";
        res.status(firebaseRes.status).json({
          status: "error",
          message: errorCode,
        });
        return;
      }

      res.json({
        status: "success",
        data: {
          idToken: data.idToken,
          email: data.email,
          expiresIn: data.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
