import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Creates an Express middleware that validates the specified request property
 * against the given Zod schema.
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate
 */
export function validate(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      }));

      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
      return;
    }

    req[source] = result.data;
    next();
  };
}
