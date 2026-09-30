import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { QueuePublisher } from "@signa/nest-queue";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { processBallotJob } from "@signa/contracts-queue/scanning";
import {
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  type OmrProcessingOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  BALLOT_REPOSITORY,
  type BallotRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  BALLOT_SCAN_RESULT_REPOSITORY,
  type BallotScanResultRepository
} from "@signa/api/modules/ballot/application/ports";
import { createBallotNotFoundError } from "@signa/api/modules/ballot/application/errors";
import { BallotResultValidator } from "@signa/api/modules/ballot/application/services/ballot-result-validator";
import { BallotScanResult } from "@signa/api/modules/ballot/domain/entities";

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;
const S3_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class OmrProcessingOutboxScheduler {
  private readonly logger = new Logger(OmrProcessingOutboxScheduler.name);

  constructor(
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository,
    @Inject(BALLOT_SCAN_RESULT_REPOSITORY)
    private readonly resultRepo: BallotScanResultRepository,
    private readonly queuePublisher: QueuePublisher,
    private readonly validator: BallotResultValidator,
    @Inject(S3_SERVICE)
    private readonly s3Service: S3Service
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
                try {
                  await this.handleJobCompletion(request, data);
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  request.markAsFailed(errorMessage);
                  await this.outboxRepo.update(request);
                  this.logger.error(
                    `Failed to process OMR result for ballot ${request.ballotId}: ${errorMessage}`
                  );
                }
              })
              .onFailed(async (error) => {
                request.markAsFailed(error.message);
                await this.outboxRepo.update(request);
                this.logger.error(
                  `OMR processing for ballot ${request.ballotId} failed: ${error.message}`
                );
              })
          );

        this.logger.log(`Published scan job for ballot ${request.ballotId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        request.markAsFailed(errorMessage);
        await this.outboxRepo.update(request);
      }
    }
  }

  /**
   * Poll for completed jobs and process their results
   * This handles jobs that completed while the scheduler was down
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processCompletedJobs() {
    // Find all processing requests
    const processingRequests = await this.outboxRepo.findProcessing(BATCH_SIZE);

    for (const request of processingRequests) {
      try {
        // Check if a result already exists for this request (job completed while we were down)
        const existingResult = await this.resultRepo.findByRequestId(request.id);

        if (existingResult) {
          // Result exists, mark outbox as completed
          request.markAsCompleted();
          await this.outboxRepo.update(request);
          this.logger.log(`Found orphaned result for request ${request.id}, marked as completed`);
        }
      } catch (error) {
        this.logger.error(`Error checking completed job for request ${request.id}:`, error);
      }
    }
  }

  /**
   * Shared logic for handling job completion
   * Used by both callbacks and recovery logic
   */
  private async handleJobCompletion(request: any, data: any) {
    // 1. Reload ballot (may have changed)
    const currentBallot = await this.ballotRepo.findById(request.ballotId);
    if (!currentBallot) {
      throw createBallotNotFoundError();
    }

    // 2. Validate worker result against ballot's immutable layout
    const validationResult = this.validator.validate(
      data.qrVerified,
      data.selections,
      currentBallot.layoutMetadata,
      data.processingMetadata
    );

    // 3. Create and save scan result
    const scanResult = BallotScanResult.create({
      requestId: request.id,
      ballotId: request.ballotId,
      userId: request.userId,
      s3Key: request.s3Key,
      selections: data.selections,
      qrVerified: data.qrVerified,
      processingMetadata: data.processingMetadata,
      validationStatus: validationResult.status,
      validationErrors: validationResult.errors.length > 0 ? validationResult.errors : undefined
    });

    await this.resultRepo.save(scanResult);

    // 4. If valid, mark ballot as voted
    if (validationResult.isValid && !currentBallot.isVoted()) {
      currentBallot.markAsVoted();
      await this.ballotRepo.update(currentBallot);
      this.logger.log(`Ballot ${request.ballotId} marked as voted`);
    } else if (!validationResult.isValid) {
      this.logger.warn(
        `Ballot ${request.ballotId} scan validation failed: ${validationResult.status}`,
        validationResult.errors
      );
    }

    // 5. Mark request as completed
    request.markAsCompleted();
    await this.outboxRepo.update(request);
    this.logger.log(`OMR processing for ballot ${request.ballotId} completed`);
  }
}
