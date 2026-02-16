/**
 * Base class for domain-level errors.
 * Carries an HTTP-friendly status code for the interface layer.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Thrown when a requested resource is not found */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} with identifier '${identifier}' not found`, 404);
  }
}

/** Thrown when a unique constraint would be violated */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}
