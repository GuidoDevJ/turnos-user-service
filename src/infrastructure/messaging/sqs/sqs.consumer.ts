import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from "@aws-sdk/client-sqs";
import { IMessageConsumer, IMessageHandler } from "../ports/message-consumer.port";
import { env } from "../../../config/env";

/** Shape expected for every SQS message body */
interface SqsEnvelope {
  eventType: string;
  [key: string]: unknown;
}

/**
 * Generic SQS long-polling consumer.
 * Dispatches incoming messages to the registered handler for their eventType.
 * Deletes a message from the queue only after successful processing.
 */
export class SqsConsumer implements IMessageConsumer {
  private running = false;

  constructor(
    private readonly sqsClient: SQSClient,
    private readonly queueUrl: string,
    private readonly handlers: Map<string, IMessageHandler>
  ) {}

  /** @inheritdoc */
  async start(): Promise<void> {
    this.running = true;
    console.log(`[SqsConsumer] Listening on queue: ${this.queueUrl}`);

    while (this.running) {
      await this.poll();
    }
  }

  /** @inheritdoc */
  stop(): void {
    this.running = false;
    console.log("[SqsConsumer] Stopping consumer...");
  }

  /**
   * Executes a single long-poll cycle and processes each received message.
   */
  private async poll(): Promise<void> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: env.sqs.maxMessages,
        WaitTimeSeconds: env.sqs.waitTimeSeconds,
      });

      const response = await this.sqsClient.send(command);
      const messages = response.Messages ?? [];

      await Promise.all(messages.map((msg) => this.processMessage(msg)));
    } catch (error) {
      console.error("[SqsConsumer] Poll error:", error);
      // Brief back-off to avoid tight loops on repeated errors
      await this.sleep(5000);
    }
  }

  /**
   * Parses and dispatches a single SQS message, then deletes it on success.
   * @param message - Raw SQS message
   */
  private async processMessage(message: Message): Promise<void> {
    const receiptHandle = message.ReceiptHandle;
    if (!receiptHandle || !message.Body) return;

    let envelope: SqsEnvelope;
    try {
      envelope = JSON.parse(message.Body) as SqsEnvelope;
    } catch {
      console.error(
        "[SqsConsumer] Failed to parse message body:",
        message.Body
      );
      await this.deleteMessage(receiptHandle);
      return;
    }

    const handler = this.handlers.get(envelope.eventType);
    if (!handler) {
      console.warn(
        `[SqsConsumer] No handler registered for eventType: ${envelope.eventType}`
      );
      await this.deleteMessage(receiptHandle);
      return;
    }

    try {
      await handler.handle(envelope);
      await this.deleteMessage(receiptHandle);
    } catch (error) {
      console.error(
        `[SqsConsumer] Handler error for eventType ${envelope.eventType}:`,
        error
      );
      // Do NOT delete — the message becomes visible again after visibility timeout
    }
  }

  /**
   * Removes a processed message from the queue.
   * @param receiptHandle - SQS receipt handle identifying the message
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.sqsClient.send(command);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
