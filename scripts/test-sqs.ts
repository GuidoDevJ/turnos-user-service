/**
 * Manual E2E test script for the SQS user-profile flow.
 *
 * Simulates an external service that:
 *   1. Sends a USER_PROFILE_REQUESTED event to the request queue
 *   2. Polls a temporary reply queue for the USER_PROFILE_RESOLVED response
 *
 * Usage:
 *   npm run sqs:test [userId]
 *   npm run sqs:test 1          # request profile for userId 1
 *   npm run sqs:test 99999      # test not-found error response
 *
 * Prerequisites:
 *   - LocalStack running : docker compose up localstack
 *   - User service running: npm run dev  (with SQS vars set in .env)
 */

import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  CreateQueueCommand,
  GetQueueUrlCommand,
} from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ── Config ─────────────────────────────────────────────────────────────────────
const ENDPOINT_URL = process.env.SQS_ENDPOINT_URL || "http://localhost:4566";
const REGION = process.env.AWS_REGION || "us-east-1";
const REQUEST_QUEUE_NAME = "user-profile-requests";
const userId = parseInt(process.argv[2] || "1", 10);
const correlationId = crypto.randomUUID();
const replyQueueName = `reply-${correlationId.slice(0, 8)}`;

// ── Client ─────────────────────────────────────────────────────────────────────
const sqs = new SQSClient({
  region: REGION,
  endpoint: ENDPOINT_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
});

/**
 * Returns the URL of an existing queue or creates it if missing.
 */
async function ensureQueue(name: string): Promise<string> {
  try {
    const res = await sqs.send(new GetQueueUrlCommand({ QueueName: name }));
    return res.QueueUrl!;
  } catch {
    const res = await sqs.send(new CreateQueueCommand({ QueueName: name }));
    return res.QueueUrl!;
  }
}

/**
 * Polls a queue until it receives a message whose correlationId matches,
 * then deletes the message and returns the body.
 */
async function pollForReply(queueUrl: string, timeoutMs = 30000): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;

  process.stdout.write(`\n[test-sqs] Waiting for response (${timeoutMs / 1000}s timeout)`);

  while (Date.now() < deadline) {
    const res = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 3,
      })
    );

    const messages = res.Messages ?? [];
    if (messages.length === 0) {
      process.stdout.write(".");
      continue;
    }

    const msg = messages[0];
    const body = JSON.parse(msg.Body!) as { correlationId?: string };

    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: msg.ReceiptHandle!,
      })
    );

    if (body.correlationId === correlationId) {
      process.stdout.write("\n");
      return body;
    }
  }

  throw new Error("Timed out waiting for reply");
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("[test-sqs] USER_PROFILE_REQUESTED — E2E Test");
  console.log("=".repeat(60));
  console.log(`  Endpoint    : ${ENDPOINT_URL}`);
  console.log(`  UserId      : ${userId}`);
  console.log(`  CorrelationId: ${correlationId}`);

  // 1. Resolve request queue URL and create a temporary reply queue
  const requestQueueUrl = await ensureQueue(REQUEST_QUEUE_NAME);
  const replyQueueUrl = await ensureQueue(replyQueueName);

  console.log(`\n  Request Q   : ${requestQueueUrl}`);
  console.log(`  Reply Q     : ${replyQueueUrl}`);

  // 2. Build and send the event
  const event = {
    eventType: "USER_PROFILE_REQUESTED",
    correlationId,
    replyQueueUrl,
    payload: { userId },
  };

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: requestQueueUrl,
      MessageBody: JSON.stringify(event),
    })
  );

  console.log("\n[test-sqs] ✓ Event sent:");
  console.log(JSON.stringify(event, null, 2));

  // 3. Poll the reply queue
  const response = await pollForReply(replyQueueUrl);

  console.log("\n[test-sqs] ✓ Response received:");
  console.log(JSON.stringify(response, null, 2));

  const res = response as { error?: unknown };
  if (res.error) {
    console.log("\n[test-sqs] ⚠  Error response (user not found or internal error)");
  } else {
    console.log("\n[test-sqs] ✓ Success");
  }
}

main().catch((err) => {
  console.error("\n[test-sqs] ✗ ERROR:", err.message);
  process.exit(1);
});
