import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "../generated/prisma/client";
import { buildTestApp, createTestPrismaClient } from "./helpers/app.helper";

/**
 * Integration tests for the Client registration and profile management flows.
 * Requires a running PostgreSQL database pointed to by DATABASE_URL.
 */
describe("Client Integration Tests", () => {
  let prisma: PrismaClient;
  let app: ReturnType<typeof buildTestApp>;

  const uniqueSuffix = () => Date.now().toString();

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
    app = buildTestApp(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up in reverse FK order
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /api/users/client — register a new client", () => {
    it("should create both user and client profile, returning UserFullProfile", async () => {
      const suffix = uniqueSuffix();

      const response = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-client-${suffix}`,
          username: `client_${suffix}`,
          email: `client_${suffix}@example.com`,
          firstName: "Alice",
          lastName: "Smith",
          preferredPaymentMethod: "credit_card",
          notes: "Prefers mornings",
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");

      const data = response.body.data;
      expect(data.profileType).toBe("CLIENT");
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(`client_${suffix}@example.com`);
      expect(data.profile).toBeDefined();
      expect(data.profile.preferredPaymentMethod).toBe("credit_card");
      expect(data.profile.notes).toBe("Prefers mornings");
      expect(data.profile.loyaltyPoints).toBe(0);
    });

    it("should return 409 when email already exists", async () => {
      const suffix = uniqueSuffix();
      const payload = {
        firebaseUid: `firebase-dup-${suffix}`,
        username: `dup_${suffix}`,
        email: `dup_${suffix}@example.com`,
        firstName: "Bob",
        lastName: "Jones",
      };

      await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send(payload);

      const response = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({
          ...payload,
          firebaseUid: "different-uid",
          username: "different_username",
        });

      expect(response.status).toBe(409);
    });

    it("should return 400 when required fields are missing", async () => {
      const response = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({ firstName: "Incomplete" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/users/:id/profile — fetch full client profile", () => {
    it("should return the user with client extension", async () => {
      const suffix = uniqueSuffix();

      const createRes = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-profile-${suffix}`,
          username: `profile_${suffix}`,
          email: `profile_${suffix}@example.com`,
          firstName: "Carol",
          lastName: "White",
        });

      const userId = createRes.body.data.user.id;

      const profileRes = await request(app)
        .get(`/api/users/${userId}/profile`)
        .set("Authorization", "Bearer test-token");

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.profileType).toBe("CLIENT");
      expect(profileRes.body.data.user.id).toBe(userId);
      expect(profileRes.body.data.profile).not.toBeNull();
    });

    it("should return 404 for a non-existent user", async () => {
      const response = await request(app)
        .get("/api/users/999999/profile")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/clients/:id — fetch client by profile ID", () => {
    it("should return the client profile", async () => {
      const suffix = uniqueSuffix();

      const createRes = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-getclient-${suffix}`,
          username: `getclient_${suffix}`,
          email: `getclient_${suffix}@example.com`,
          firstName: "Dave",
          lastName: "Brown",
          preferredPaymentMethod: "cash",
        });

      const clientId = createRes.body.data.profile.id;

      const clientRes = await request(app)
        .get(`/api/clients/${clientId}`)
        .set("Authorization", "Bearer test-token");

      expect(clientRes.status).toBe(200);
      expect(clientRes.body.data.id).toBe(clientId);
      expect(clientRes.body.data.preferredPaymentMethod).toBe("cash");
    });
  });

  describe("PUT /api/clients/:id — update client profile", () => {
    it("should update loyalty points and notes", async () => {
      const suffix = uniqueSuffix();

      const createRes = await request(app)
        .post("/api/users/client")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-update-${suffix}`,
          username: `update_${suffix}`,
          email: `update_${suffix}@example.com`,
          firstName: "Eve",
          lastName: "Davis",
        });

      const clientId = createRes.body.data.profile.id;

      const updateRes = await request(app)
        .put(`/api/clients/${clientId}`)
        .set("Authorization", "Bearer test-token")
        .send({ loyaltyPoints: 150, notes: "VIP client" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.loyaltyPoints).toBe(150);
      expect(updateRes.body.data.notes).toBe("VIP client");
    });
  });
});
