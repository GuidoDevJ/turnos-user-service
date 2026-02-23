import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

/**
 * Publishes messages to an SQS queue.
 * Used by handlers to send responses back to reply queues.
 */
export class SqsPublisher {
  constructor(private readonly sqsClient: SQSClient) {}

  /**
   * Sends a JSON-serialized message to the specified queue.
   * @param queueUrl - Target SQS queue URL
   * @param payload - The object to serialize and send
   */
  async publish(queueUrl: string, payload: unknown): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
    });

    await this.sqsClient.send(command);
  }
}
