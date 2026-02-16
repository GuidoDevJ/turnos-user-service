import { Request, Response, NextFunction } from "express";
import { firebaseAdmin } from "../../../config/firebase";

export interface FirebaseUser {
  uid: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: FirebaseUser;
    }
  }
}

export async function firebaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ status: "error", message: "Missing or invalid authorization token" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    req.firebaseUser = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
}
