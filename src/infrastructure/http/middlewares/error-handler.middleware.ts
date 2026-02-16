import { Request, Response, NextFunction } from "express";
import { DomainError } from "../../../domain/errors/domain.error";

/**
 * Global error handler middleware.
 * Catches domain errors and unknown errors, returning a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
