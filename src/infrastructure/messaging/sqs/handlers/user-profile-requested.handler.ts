import { IMessageHandler } from "../../ports/message-consumer.port";
import { SqsPublisher } from "../sqs.publisher";
import { GetUserFullProfileUseCase } from "../../../../application/use-cases/user/get-user-full-profile.use-case";
import { NotFoundError } from "../../../../domain/errors/domain.error";

/** Shape of the incoming USER_PROFILE_REQUESTED event */
interface UserProfileRequestedPayload {
  eventType: "USER_PROFILE_REQUESTED";
  correlationId: string;
  replyQueueUrl: string;
  payload: {
    userId: number;
  };
}

/** Shape of the successful response event */
interface UserProfileResolvedSuccess {
  eventType: "USER_PROFILE_RESOLVED";
  correlationId: string;
  payload: unknown;
  error: null;
}

/** Shape of the error response event */
interface UserProfileResolvedError {
  eventType: "USER_PROFILE_RESOLVED";
  correlationId: string;
  payload: null;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Handles USER_PROFILE_REQUESTED events from SQS.
 * Fetches the full user profile (user + client/professional extension)
 * and publishes a USER_PROFILE_RESOLVED response to the caller's reply queue.
 */
export class UserProfileRequestedHandler
  implements IMessageHandler<UserProfileRequestedPayload>
{
  readonly eventType = "USER_PROFILE_REQUESTED";

  constructor(
    private readonly getUserFullProfileUseCase: GetUserFullProfileUseCase,
    private readonly publisher: SqsPublisher
  ) {}

  /**
   * @param envelope - The deserialized SQS message body
   */
  async handle(envelope: UserProfileRequestedPayload): Promise<void> {
    const { correlationId, replyQueueUrl, payload } = envelope;

    if (!correlationId || !replyQueueUrl || !payload?.userId) {
      console.warn(
        "[UserProfileRequestedHandler] Malformed event — missing required fields:",
        envelope
      );
      return;
    }

    try {
      const profile = await this.getUserFullProfileUseCase.execute(
        payload.userId
      );

      const response: UserProfileResolvedSuccess = {
        eventType: "USER_PROFILE_RESOLVED",
        correlationId,
        payload: profile,
        error: null,
      };

      await this.publisher.publish(replyQueueUrl, response);
    } catch (error) {
      const isNotFound = error instanceof NotFoundError;

      const response: UserProfileResolvedError = {
        eventType: "USER_PROFILE_RESOLVED",
        correlationId,
        payload: null,
        error: {
          code: isNotFound ? "USER_NOT_FOUND" : "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };

      await this.publisher.publish(replyQueueUrl, response);
    }
  }
}
