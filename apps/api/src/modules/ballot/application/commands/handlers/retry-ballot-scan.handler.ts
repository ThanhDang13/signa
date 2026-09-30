import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { RetryBallotScanCommand } from "@signa/api/modules/ballot/application/commands";
import {
  BALLOT_REPOSITORY,
  type BallotRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  type OmrProcessingOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  BALLOT_SCAN_RESULT_REPOSITORY,
  type BallotScanResultRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  createScanRequestNotFoundError,
  createScanRequestForbiddenError,
  createRetryNotAllowedError,
  createBallotAlreadyVotedError
} from "@signa/api/modules/ballot/application/errors";

@CommandHandler(RetryBallotScanCommand)
export class RetryBallotScanHandler implements ICommandHandler<RetryBallotScanCommand> {
  constructor(
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository,
    @Inject(BALLOT_SCAN_RESULT_REPOSITORY)
    private readonly resultRepo: BallotScanResultRepository
  ) {}

  async execute(command: RetryBallotScanCommand) {
    const { requestId, s3Key, userId } = command.payload;

    // 1. Load the request
    const request = await this.outboxRepo.findById(requestId);
    if (!request) {
      throw createScanRequestNotFoundError();
    }

    // 2. TODO: Ownership check - should migrate to policy guard later
    // Currently implemented in handler for immediate delivery
    if (request.userId !== userId) {
      throw createScanRequestForbiddenError();
    }

    // 3. Reject if request is active
    if (request.isActive()) {
      throw createRetryNotAllowedError();
    }

    // 4. Verify ballot hasn't been voted in the meantime
    const ballot = await this.ballotRepo.findById(request.ballotId);
    if (ballot?.isVoted()) {
      throw createBallotAlreadyVotedError();
    }

    // 5. Delete old result if exists (for retry idempotency)
    await this.resultRepo.deleteByRequestId(requestId);

    // 6. Reset request for retry with new S3 key
    request.resetForRetry(s3Key);

    // 7. Update request
    await this.outboxRepo.update(request);

    return {
      message: "Scan request reset for retry",
      requestId: request.id
    };
  }
}
