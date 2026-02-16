import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Turnos User Service API",
      version: "1.0.0",
      description: "User management microservice for the Turnos platform",
    },
    components: {
      schemas: {
        CreateUserInput: {
          type: "object",
          required: [
            "firebaseUid",
            "username",
            "email",
            "firstName",
            "lastName",
            "roleId",
          ],
          properties: {
            firebaseUid: {
              type: "string",
              example: "firebase-abc123",
            },
            username: { type: "string", example: "johndoe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+5491112345678" },
            address: { type: "string", example: "Av. Corrientes 1234" },
            roleId: { type: "integer", example: 2 },
          },
        },
        RegisterUserInput: {
          type: "object",
          required: [
            "firebaseUid",
            "username",
            "email",
            "firstName",
            "lastName",
          ],
          properties: {
            firebaseUid: {
              type: "string",
              example: "firebase-abc123",
            },
            username: { type: "string", example: "johndoe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            phone: { type: "string", example: "+5491112345678" },
            address: { type: "string", example: "Av. Corrientes 1234" },
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
                phone: { type: "string", example: "+5491112345678" },
                address: { type: "string", example: "Av. Corrientes 1234" },
                roleId: { type: "integer", example: 2 },
                isActive: { type: "boolean", example: true },
                isVerified: { type: "boolean", example: false },
                emailVerifiedAt: {
                  type: "string",
                  format: "date-time",
                  nullable: true,
                },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/infrastructure/http/routes/*.ts"],
};

/** Generated OpenAPI specification */
export const swaggerSpec = swaggerJsdoc(options);
