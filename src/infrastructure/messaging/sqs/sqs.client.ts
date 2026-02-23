import { SQSClient } from "@aws-sdk/client-sqs";
import { env } from "../../../config/env";

/**
 * Creates a configured SQS client.
 *
 * - In production: uses real AWS credentials and the default endpoint.
 * - In local development: set SQS_ENDPOINT_URL=http://localhost:4566 to
 *   point at LocalStack. Credentials are irrelevant (use "test"/"test").
 */
export function createSqsClient(): SQSClient {
  const { region, accessKeyId, secretAccessKey, endpointUrl } = env.sqs;

  const credentials =
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined;

  return new SQSClient({
    region,
    credentials,
    ...(endpointUrl ? { endpoint: endpointUrl } : {}),
  });
}
