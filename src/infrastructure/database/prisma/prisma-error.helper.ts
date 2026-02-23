/**
 * Extracts the conflicting field name from a Prisma P2002 error.
 *
 * Prisma v7 with driver adapters (e.g. @prisma/adapter-pg) no longer populates
 * `error.meta.target`. Instead the field list is nested under:
 *   error.meta.driverAdapterError.cause.constraint.fields
 *
 * This helper tries the new path first and falls back to the legacy path.
 */
export function p2002Field(meta: any): string | undefined {
  // Prisma v7 + driver adapter format
  const adapterFields: string[] | undefined =
    meta?.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(adapterFields) && adapterFields.length > 0) {
    return adapterFields[0];
  }

  // Legacy format (Prisma v5/v6 without driver adapters)
  const legacyTarget: string[] | undefined = meta?.target;
  if (Array.isArray(legacyTarget) && legacyTarget.length > 0) {
    return legacyTarget[0];
  }

  return undefined;
}
