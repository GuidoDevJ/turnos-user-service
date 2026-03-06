import dotenv from 'dotenv';

dotenv.config();

/** Application environment configuration */
export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '{}',
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY || '',

  /** AWS SQS configuration */
  sqs: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    endpointUrl: process.env.SQS_ENDPOINT_URL || '',
    /** Queue that receives user-profile-request events from other services */
    requestQueueUrl: process.env.SQS_REQUEST_QUEUE_URL || '',
    /** Queue where role-service publishes ROLE_CREATED/UPDATED/DELETED events */
    roleEventsQueueUrl: process.env.SQS_ROLE_EVENTS_QUEUE_URL || '',
    /** Queue used to request a full roles sync from role-service on startup */
    rolesSyncRequestQueueUrl:
      process.env.SQS_ROLES_SYNC_REQUEST_QUEUE_URL || '',
    /** Queue where this service broadcasts user lifecycle events (USER_ROLE_ASSIGNED, etc.) */
    userEventsQueueUrl: process.env.SQS_USER_EVENTS_QUEUE_URL || '',
    maxMessages: parseInt(process.env.SQS_MAX_MESSAGES || '10', 10),
    waitTimeSeconds: parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20', 10),
  },
} as const;
