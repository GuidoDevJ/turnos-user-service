import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Turnos User Service API",
      version: "1.0.0",
      description:
        "User management microservice for the Turnos platform.\n\n" +
        "**How to authenticate:**\n" +
        "1. Call `POST /api/auth/token` with your email and password.\n" +
        "2. Copy the `idToken` from the response.\n" +
        "3. Click **Authorize** and enter `Bearer <idToken>`.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Firebase ID token. Obtain it from POST /api/auth/token.",
        },
      },
      schemas: {
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", example: "secret123" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                idToken: {
                  type: "string",
                  description: "Firebase ID token — use this as Bearer token",
                  example: "eyJhbGci...",
                },
                email: { type: "string", example: "john@example.com" },
                expiresIn: { type: "string", example: "3600" },
              },
            },
          },
        },
        CreateUserInput: {
          type: "object",
          required: ["firebaseUid", "username", "email", "firstName", "lastName", "roleId"],
          properties: {
            firebaseUid: { type: "string", example: "firebase-abc123" },
            username: { type: "string", example: "johndoe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+5491112345678" },
            address: { type: "string", example: "Av. Corrientes 1234" },
            roleId: { type: "integer", example: 3 },
          },
        },
        RegisterClientInput: {
          type: "object",
          required: ["firebaseUid", "username", "email", "firstName", "lastName"],
          properties: {
            firebaseUid: { type: "string", example: "firebase-abc123" },
            username: { type: "string", example: "johndoe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+5491112345678" },
            address: { type: "string", example: "Av. Corrientes 1234" },
            preferredPaymentMethod: { type: "string", example: "credit_card" },
            notes: { type: "string", example: "Prefers morning appointments" },
          },
        },
        RegisterProfessionalInput: {
          type: "object",
          required: ["firebaseUid", "username", "email", "firstName", "lastName"],
          properties: {
            firebaseUid: { type: "string", example: "firebase-xyz789" },
            username: { type: "string", example: "drsmith" },
            email: { type: "string", format: "email", example: "dr.smith@example.com" },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Smith" },
            phone: { type: "string", example: "+5491198765432" },
            address: { type: "string", example: "Av. Santa Fe 2000" },
            bio: { type: "string", example: "Experienced physiotherapist with 10 years." },
            specialization: { type: "string", example: "Physiotherapy" },
            licenseNumber: { type: "string", example: "MN-123456" },
            yearsExperience: { type: "integer", example: 10 },
          },
        },
        UpdateUserInput: {
          type: "object",
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            roleId: { type: "integer" },
            isActive: { type: "boolean" },
            isVerified: { type: "boolean" },
          },
        },
        UpdateClientInput: {
          type: "object",
          properties: {
            preferredPaymentMethod: { type: "string", nullable: true },
            loyaltyPoints: { type: "integer", minimum: 0 },
            notes: { type: "string", nullable: true },
          },
        },
        UpdateProfessionalInput: {
          type: "object",
          properties: {
            bio: { type: "string", nullable: true },
            specialization: { type: "string", nullable: true },
            licenseNumber: { type: "string", nullable: true },
            yearsExperience: { type: "integer", nullable: true },
            isAvailable: { type: "boolean" },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                firebaseUid: { type: "string", example: "firebase-abc123" },
                username: { type: "string", example: "johndoe" },
                email: { type: "string", example: "john@example.com" },
                firstName: { type: "string", example: "John" },
                lastName: { type: "string", example: "Doe" },
                phone: { type: "string", example: "+5491112345678", nullable: true },
                address: { type: "string", example: "Av. Corrientes 1234", nullable: true },
                roleId: { type: "integer", example: 3 },
                isActive: { type: "boolean", example: true },
                isVerified: { type: "boolean", example: false },
                emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        ClientResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                userId: { type: "integer", example: 10 },
                preferredPaymentMethod: { type: "string", example: "credit_card", nullable: true },
                loyaltyPoints: { type: "integer", example: 0 },
                notes: { type: "string", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        ProfessionalResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                userId: { type: "integer", example: 11 },
                bio: { type: "string", nullable: true },
                specialization: { type: "string", nullable: true },
                licenseNumber: { type: "string", nullable: true },
                yearsExperience: { type: "integer", nullable: true },
                isAvailable: { type: "boolean", example: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        UserFullProfileResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                user: {
                  type: "object",
                  description: "Base user data",
                },
                profile: {
                  nullable: true,
                  description: "Client or Professional profile extension",
                  type: "object",
                },
                profileType: {
                  type: "string",
                  enum: ["CLIENT", "PROFESSIONAL"],
                  nullable: true,
                  example: "CLIENT",
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/infrastructure/http/routes/*.ts"],
};

/** Generated OpenAPI specification */
export const swaggerSpec = swaggerJsdoc(options);
