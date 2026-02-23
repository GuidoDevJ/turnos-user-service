import dotenv from "dotenv";

dotenv.config();

/** Application environment configuration */
export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY || "",

  /** AWS SQS configuration */
  sqs: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    /**
     * Custom endpoint URL — use this to point to LocalStack in local dev.
     * Example: http://localhost:4566
     * Leave empty to use the real AWS SQS endpoint.
     */
    endpointUrl: process.env.SQS_ENDPOINT_URL || "",
    /** Queue that receives user-profile-request events from other services */
    requestQueueUrl: process.env.SQS_REQUEST_QUEUE_URL || "",
    /** Max number of messages to receive per poll cycle (1–10) */
    maxMessages: parseInt(process.env.SQS_MAX_MESSAGES || "10", 10),
    /** Long-polling wait time in seconds (0–20) */
    waitTimeSeconds: parseInt(process.env.SQS_WAIT_TIME_SECONDS || "20", 10),
  },
} as const;
