import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { QueuePublisher } from "@signa/nest-queue";
import { processBallotJob } from "@signa/contracts-queue/scanning";
import {
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  type OmrProcessingOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  BALLOT_REPOSITORY,
  type BallotRepository
} from "@signa/api/modules/ballot/application/ports";
import { createBallotNotFoundError } from "@signa/api/modules/ballot/application/errors";

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class OmrProcessingOutboxScheduler {
  private readonly logger = new Logger(OmrProcessingOutboxScheduler.name);

  constructor(
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository,
    private readonly queuePublisher: QueuePublisher
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async publishPending() {
    const requests = await this.outboxRepo.findPending(BATCH_SIZE);

    for (const request of requests) {
      // Check if request can retry
      if (!request.canRetry(MAX_ATTEMPTS)) {
        request.markAsFailed("Max attempts exceeded");
        await this.outboxRepo.update(request);
        this.logger.warn(`Request ${request.id} exceeded max attempts`);
        continue;
      }

      try {
        // Mark as processing and increment attempts
        request.markAsProcessing();
        request.incrementAttempts();
        request.generateDispatchId();
        await this.outboxRepo.update(request);

        // Fetch ballot to get layout metadata
        const ballot = await this.ballotRepo.findById(request.ballotId);
        if (!ballot) {
          throw createBallotNotFoundError();
        }

        // Publish to scan queue with dispatchId as jobId
        await this.queuePublisher.publish(
          processBallotJob,
          {
            requestId: request.id,
            s3Key: request.s3Key,
            ballotId: request.ballotId,
            layout: ballot.layoutMetadata
          },
          {
            jobId: request.dispatchId!,
            attempts: 1 // Retry controlled by outbox, not BullMQ
          }
        );

        this.logger.log(
          `Published scan job requestId=${request.id} attempt=${request.attempts} dispatchId=${request.dispatchId}`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        request.markAsFailed(errorMessage);
        await this.outboxRepo.update(request);
        this.logger.error(`Failed to publish request ${request.id}: ${errorMessage}`);
      }
    }
  }

  /**
   * Recover stuck requests that have been processing for too long
   * Resets them to pending for retry
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async recoverStuck() {
    const processingRequests = await this.outboxRepo.findProcessing(BATCH_SIZE);
    const now = new Date();

    let recoveredCount = 0;

    for (const request of processingRequests) {
      if (!request.processingStartedAt) {
        // Missing processingStartedAt (should not happen), treat as stuck
        request.status = "pending";
        await this.outboxRepo.update(request);
        recoveredCount++;
        continue;
      }

      const processingTime = now.getTime() - request.processingStartedAt.getTime();

      if (processingTime > PROCESSING_TIMEOUT_MS) {
        this.logger.warn(
          `Request ${request.id} stuck in processing for ${Math.round(processingTime / 1000)}s, resetting to pending`
        );

        request.status = "pending";
        request.lastError = `Processing timeout after ${Math.round(processingTime / 1000)}s`;
        await this.outboxRepo.update(request);
        recoveredCount++;
      }
    }

    if (recoveredCount > 0) {
      this.logger.log(`Recovered ${recoveredCount} stuck requests`);
    }
  }
}
