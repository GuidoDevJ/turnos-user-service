import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "../generated/prisma/client";
import { buildTestApp, createTestPrismaClient } from "./helpers/app.helper";

/**
 * Integration tests for the Professional registration and profile management flows.
 * Requires a running PostgreSQL database pointed to by DATABASE_URL.
 */
describe("Professional Integration Tests", () => {
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
    await prisma.professional.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /api/users/professional — register a new professional", () => {
    it("should create both user and professional profile, returning UserFullProfile", async () => {
      const suffix = uniqueSuffix();

      const response = await request(app)
        .post("/api/users/professional")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-prof-${suffix}`,
          username: `prof_${suffix}`,
          email: `prof_${suffix}@example.com`,
          firstName: "Dr. Frank",
          lastName: "Castle",
          bio: "10 years of physiotherapy experience",
          specialization: "Physiotherapy",
          licenseNumber: `LIC-${suffix}`,
          yearsExperience: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");

      const data = response.body.data;
      expect(data.profileType).toBe("PROFESSIONAL");
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(`prof_${suffix}@example.com`);
      expect(data.profile).toBeDefined();
      expect(data.profile.specialization).toBe("Physiotherapy");
      expect(data.profile.yearsExperience).toBe(10);
      expect(data.profile.isAvailable).toBe(true);
    });

    it("should return 409 when license number is duplicated", async () => {
      const suffix = uniqueSuffix();
      const licenseNumber = `LIC-DUP-${suffix}`;

      await request(app)
        .post("/api/users/professional")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-prof-lic1-${suffix}`,
          username: `prof_lic1_${suffix}`,
          email: `prof_lic1_${suffix}@example.com`,
          firstName: "First",
          lastName: "Prof",
          licenseNumber,
        });

      const response = await request(app)
        .post("/api/users/professional")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-prof-lic2-${suffix}`,
          username: `prof_lic2_${suffix}`,
          email: `prof_lic2_${suffix}@example.com`,
          firstName: "Second",
          lastName: "Prof",
          licenseNumber,
        });

      expect(response.status).toBe(409);
    });
  });

  describe("GET /api/users/:id/profile — fetch full professional profile", () => {
    it("should return the user with professional extension", async () => {
      const suffix = uniqueSuffix();

      const createRes = await request(app)
        .post("/api/users/professional")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-profprofile-${suffix}`,
          username: `profprofile_${suffix}`,
          email: `profprofile_${suffix}@example.com`,
          firstName: "Grace",
          lastName: "Hopper",
          specialization: "Cardiology",
        });

      const userId = createRes.body.data.user.id;

      const profileRes = await request(app)
        .get(`/api/users/${userId}/profile`)
        .set("Authorization", "Bearer test-token");

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.profileType).toBe("PROFESSIONAL");
      expect(profileRes.body.data.profile.specialization).toBe("Cardiology");
    });
  });

  describe("PUT /api/professionals/:id — update professional profile", () => {
    it("should update availability and bio", async () => {
      const suffix = uniqueSuffix();

      const createRes = await request(app)
        .post("/api/users/professional")
        .set("Authorization", "Bearer test-token")
        .send({
          firebaseUid: `firebase-profupdate-${suffix}`,
          username: `profupdate_${suffix}`,
          email: `profupdate_${suffix}@example.com`,
          firstName: "Henry",
          lastName: "Ford",
        });

      const profId = createRes.body.data.profile.id;

      const updateRes = await request(app)
        .put(`/api/professionals/${profId}`)
        .set("Authorization", "Bearer test-token")
        .send({ isAvailable: false, bio: "On sabbatical" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.isAvailable).toBe(false);
      expect(updateRes.body.data.bio).toBe("On sabbatical");
    });

    it("should return 404 when professional does not exist", async () => {
      const response = await request(app)
        .put("/api/professionals/999999")
        .set("Authorization", "Bearer test-token")
        .send({ isAvailable: false });

      expect(response.status).toBe(404);
    });
  });
});
