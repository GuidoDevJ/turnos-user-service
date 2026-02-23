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

    // Express 5 defines req.query and req.params as getter-only on the prototype.
    // Use Object.defineProperty to shadow them on the instance.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
