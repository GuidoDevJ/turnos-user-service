import { User } from "./user.entity";
import { Client } from "./client.entity";
import { Professional } from "./professional.entity";

/** Discriminated union type for the extended profile of a user */
export type ProfileType = "CLIENT" | "PROFESSIONAL";

/**
 * Represents a complete user profile including their role-specific extension.
 * Used as the response shape for full-profile queries and SQS events.
 */
export interface UserFullProfile {
  user: User;
  profile: Client | Professional | null;
  profileType: ProfileType | null;
}
