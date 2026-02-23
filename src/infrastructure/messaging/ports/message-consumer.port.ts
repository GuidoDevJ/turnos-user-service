/**
 * Port: Generic message handler interface.
 * Each concrete handler processes a specific event type.
 * @template T - The shape of the event payload
 */
export interface IMessageHandler<T = unknown> {
  /** The event type this handler is responsible for */
  readonly eventType: string;

  /**
   * Process an incoming event.
   * @param payload - The deserialized event payload
   */
  handle(payload: T): Promise<void>;
}

/**
 * Port: Message consumer lifecycle interface.
 * Abstracts the underlying transport (SQS, RabbitMQ, etc.).
 */
export interface IMessageConsumer {
  /** Start polling for messages */
  start(): Promise<void>;

  /** Gracefully stop the consumer */
  stop(): void;
}
