import dotenv from "dotenv";

dotenv.config();

/** Application environment configuration */
export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
} as const;
