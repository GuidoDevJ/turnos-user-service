/**
 * Role ID mapping.
 * These IDs must match the ones managed by the roles microservice.
 * TODO: Replace with an API call to the roles microservice when available.
 */
export const RoleId = {
  ADMIN: parseInt(process.env.ROLE_ID_ADMIN || "1", 10),
  PROFESSIONAL: parseInt(process.env.ROLE_ID_PROFESSIONAL || "2", 10),
  CLIENT: parseInt(process.env.ROLE_ID_CLIENT || "3", 10),
} as const;
