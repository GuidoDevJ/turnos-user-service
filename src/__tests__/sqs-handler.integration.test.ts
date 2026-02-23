import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaUserRepository } from "../infrastructure/database/prisma/user.repository.impl";
import { PrismaClientRepository } from "../infrastructure/database/prisma/client.repository.impl";
import { PrismaProfessionalRepository } from "../infrastructure/database/prisma/professional.repository.impl";
import { GetUserFullProfileUseCase } from "../application/use-cases/user/get-user-full-profile.use-case";
import { CreateClientUseCase } from "../application/use-cases/create-client.use-case";
import { SqsPublisher } from "../infrastructure/messaging/sqs/sqs.publisher";
import { UserProfileRequestedHandler } from "../infrastructure/messaging/sqs/handlers/user-profile-requested.handler";
import { createTestPrismaClient } from "./helpers/app.helper";

/**
 * Integration tests for the SQS UserProfileRequestedHandler.
 * Tests the full flow from event receipt to profile resolution and publishing.
 * SqsPublisher is mocked to avoid real AWS calls.
 */
describe("UserProfileRequestedHandler Integration Tests", () => {
  let prisma: PrismaClient;
  let userRepo: PrismaUserRepository;
  let clientRepo: PrismaClientRepository;
  let professionalRepo: PrismaProfessionalRepository;
  let getUserFullProfile: GetUserFullProfileUseCase;
  let createClientUseCase: CreateClientUseCase;
  let mockPublisher: SqsPublisher;
  let handler: UserProfileRequestedHandler;

  const uniqueSuffix = () => Date.now().toString();

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();

    userRepo = new PrismaUserRepository(prisma);
    clientRepo = new PrismaClientRepository(prisma);
    professionalRepo = new PrismaProfessionalRepository(prisma);

    getUserFullProfile = new GetUserFullProfileUseCase(
      userRepo,
      clientRepo,
      professionalRepo
    );

    createClientUseCase = new CreateClientUseCase(userRepo, clientRepo);

    mockPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as SqsPublisher;

    handler = new UserProfileRequestedHandler(getUserFullProfile, mockPublisher);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.client.deleteMany();
    await prisma.professional.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should publish USER_PROFILE_RESOLVED with client data when user exists", async () => {
    const suffix = uniqueSuffix();

    const { user } = await createClientUseCase.execute({
      firebaseUid: `firebase-sqs-${suffix}`,
      username: `sqsclient_${suffix}`,
      email: `sqsclient_${suffix}@example.com`,
      firstName: "SQS",
      lastName: "Client",
      preferredPaymentMethod: "cash",
    });

    await handler.handle({
      eventType: "USER_PROFILE_REQUESTED",
      correlationId: "corr-123",
      replyQueueUrl: "https://sqs.example.com/reply-queue",
      payload: { userId: user.id },
    });

    expect(mockPublisher.publish).toHaveBeenCalledOnce();
    const [queueUrl, response] = (
      mockPublisher.publish as ReturnType<typeof vi.fn>
    ).mock.calls[0];

    expect(queueUrl).toBe("https://sqs.example.com/reply-queue");
    expect(response.eventType).toBe("USER_PROFILE_RESOLVED");
    expect(response.correlationId).toBe("corr-123");
    expect(response.error).toBeNull();
    expect(response.payload.profileType).toBe("CLIENT");
    expect(response.payload.profile.preferredPaymentMethod).toBe("cash");
  });

  it("should publish USER_PROFILE_RESOLVED error when user does not exist", async () => {
    await handler.handle({
      eventType: "USER_PROFILE_REQUESTED",
      correlationId: "corr-404",
      replyQueueUrl: "https://sqs.example.com/reply-queue",
      payload: { userId: 999999 },
    });

    expect(mockPublisher.publish).toHaveBeenCalledOnce();
    const [, response] = (
      mockPublisher.publish as ReturnType<typeof vi.fn>
    ).mock.calls[0];

    expect(response.eventType).toBe("USER_PROFILE_RESOLVED");
    expect(response.correlationId).toBe("corr-404");
    expect(response.payload).toBeNull();
    expect(response.error.code).toBe("USER_NOT_FOUND");
  });

  it("should not publish anything when the envelope is malformed", async () => {
    await handler.handle({
      eventType: "USER_PROFILE_REQUESTED",
      correlationId: "",
      replyQueueUrl: "",
      payload: { userId: 0 },
    });

    expect(mockPublisher.publish).not.toHaveBeenCalled();
  });
});
