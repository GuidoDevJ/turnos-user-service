import { IUserRepository } from "../../../domain/repositories/user.repository";
import { IClientRepository } from "../../../domain/repositories/client.repository";
import { IProfessionalRepository } from "../../../domain/repositories/professional.repository";
import { IRoleCacheRepository } from "../../../domain/repositories/role-cache.repository";
import { UserFullProfile } from "../../../domain/entities/user-full-profile.entity";
import { NotFoundError, ConflictError } from "../../../domain/errors/domain.error";
import { SqsPublisher } from "../../../infrastructure/messaging/sqs/sqs.publisher";
import { RoleId } from "../../../config/roles";
import { env } from "../../../config/env";

export type TargetRoleType = "CLIENT" | "PROFESSIONAL";

export interface AssignRoleProfileData {
  preferredPaymentMethod?: string;
  notes?: string;
  bio?: string;
  specialization?: string;
  licenseNumber?: string;
  yearsExperience?: number;
}

/**
 * Transitions an existing user to a CLIENT or PROFESSIONAL role.
 *
 * - Updates the user's roleId
 * - Creates the associated profile if it doesn't exist yet (preserves existing one)
 * - Publishes a USER_ROLE_ASSIGNED event to the user-events queue
 */
export class AssignUserRoleUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly clientRepository: IClientRepository,
    private readonly professionalRepository: IProfessionalRepository,
    private readonly roleCacheRepository: IRoleCacheRepository,
    private readonly sqsPublisher: SqsPublisher | null = null
  ) {}

  async execute(
    userId: number,
    targetRole: TargetRoleType,
    profileData?: AssignRoleProfileData
  ): Promise<UserFullProfile> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    // Resolve target roleId (cache → fallback to env constant)
    const roleCache = await this.roleCacheRepository.findByName(targetRole);
    const targetRoleId = roleCache?.id ?? RoleId[targetRole];

    if (!roleCache?.isActive && roleCache) {
      throw new ConflictError(`${targetRole} role is not currently active`);
    }

    if (user.roleId === targetRoleId) {
      throw new ConflictError(`User is already a ${targetRole}`);
    }

    const previousRoleId = user.roleId;
    const updatedUser = await this.userRepository.update(userId, { roleId: targetRoleId });

    // Create profile if it doesn't exist (keep existing data if already present)
    let profile;
    if (targetRole === "CLIENT") {
      const existing = await this.clientRepository.findByUserId(userId);
      profile = existing ?? await this.clientRepository.create({
        userId,
        preferredPaymentMethod: profileData?.preferredPaymentMethod,
        notes: profileData?.notes,
      });
    } else {
      const existing = await this.professionalRepository.findByUserId(userId);
      profile = existing ?? await this.professionalRepository.create({
        userId,
        bio: profileData?.bio,
        specialization: profileData?.specialization,
        licenseNumber: profileData?.licenseNumber,
        yearsExperience: profileData?.yearsExperience,
      });
    }

    // Publish USER_ROLE_ASSIGNED event (fire-and-forget)
    if (this.sqsPublisher && env.sqs.userEventsQueueUrl) {
      await this.sqsPublisher
        .publish(env.sqs.userEventsQueueUrl, {
          eventType: "USER_ROLE_ASSIGNED",
          payload: {
            userId,
            previousRoleId,
            newRoleId: targetRoleId,
            profileType: targetRole,
            occurredAt: new Date().toISOString(),
          },
        })
        .catch((err) => console.error("[AssignUserRole] Failed to publish event:", err));
    }

    return { user: updatedUser, profile, profileType: targetRole };
  }
}
