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
  async processPendingRequests() {
    const requests = await this.outboxRepo.findPending(BATCH_SIZE);

    for (const request of requests) {
      if (!request.canRetry(MAX_ATTEMPTS)) {
        request.markAsFailed("Max attempts exceeded");
        await this.outboxRepo.update(request);
        continue;
      }

      try {
        request.markAsProcessing();
        request.incrementAttempts();
        await this.outboxRepo.update(request);

        // Fetch ballot to get layout metadata
        const ballot = await this.ballotRepo.findById(request.ballotId);
        if (!ballot) {
          throw createBallotNotFoundError();
        }

        // Publish to scan queue with layout data
        await this.queuePublisher
          .publish(processBallotJob, {
            s3Key: request.s3Key,
            ballotId: request.ballotId,
            layout: ballot.layoutMetadata
          })
          .then((result) =>
            result
              .onCompleted(async (data) => {
                // Store OMR results (implementation depends on requirements)
                // For now, just mark as completed
                request.markAsCompleted();
                await this.outboxRepo.update(request);
                this.logger.log(`OMR processing for ballot ${request.ballotId} completed`);
              })
              .onFailed(async (error) => {
                request.markAsFailed(error.message);
                await this.outboxRepo.update(request);
                this.logger.error(
                  `OMR processing for ballot ${request.ballotId} failed: ${error.message}`
                );
              })
          );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        request.markAsFailed(errorMessage);
        await this.outboxRepo.update(request);
      }
    }
  }
}
