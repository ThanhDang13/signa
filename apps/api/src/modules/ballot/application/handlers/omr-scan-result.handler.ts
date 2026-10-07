import { Injectable, Logger, Inject } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { OnJobResult } from "@signa/nest-queue";
import { processBallotJob } from "@signa/contracts-queue/scanning";
import type { JobResult } from "@signa/contracts-queue";
import type { InferJobResult } from "@signa/dsl-queue-contract";
import {
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  type OmrProcessingOutboxRepository,
  BALLOT_REPOSITORY,
  type BallotRepository,
  BALLOT_SCAN_RESULT_REPOSITORY,
  type BallotScanResultRepository
} from "@signa/api/modules/ballot/application/ports";
import { BallotResultValidator } from "@signa/api/modules/ballot/application/services/ballot-result-validator";
import { BallotScanResult } from "@signa/api/modules/ballot/domain/entities";
import { createBallotNotFoundError } from "@signa/api/modules/ballot/application/errors";
import { GetElectionStatusQuery } from "@signa/api/modules/election/application/queries";

/**
 * Handler for OMR processing job results
 * Processes results from the scan worker queue
 */
@Injectable()
export class OmrScanResultHandler {
  private readonly logger = new Logger(OmrScanResultHandler.name);

  constructor(
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository,
    @Inject(BALLOT_SCAN_RESULT_REPOSITORY)
    private readonly resultRepo: BallotScanResultRepository,
    private readonly validator: BallotResultValidator,
    private readonly queryBus: QueryBus
  ) {}

  @OnJobResult(processBallotJob)
  async handleOmrResult(
    result: JobResult<InferJobResult<typeof processBallotJob>>
  ): Promise<void> {
    this.logger.log(`Processing job result: ${result.jobId} (request: ${result.requestId}, attempt: ${result.attempt})`);

    // 1. Load the outbox request
    const request = await this.outboxRepo.findById(result.requestId);
    if (!request) {
      this.logger.warn(`Request ${result.requestId} not found, skipping result`);
      return; // Idempotent: request may have been deleted
    }

    // 2. Check if request is already completed
    if (request.isTerminal()) {
      this.logger.log(`Request ${result.requestId} already terminal (${request.status}), skipping result`);
      return; // Idempotent: already processed
    }

    // 3. Check for stale results (from superseded dispatches)
    if (result.jobId !== request.dispatchId) {
      this.logger.log(
        `Ignoring stale result: jobId ${result.jobId} does not match current dispatchId ${request.dispatchId} for request ${result.requestId}`
      );
      return; // Ignore results from old dispatches
    }

    // 4. Handle failed jobs
    if (result.status === "failed") {
      this.logger.error(
        `Job failed for request ${result.requestId}: ${result.error?.message} (retryable: ${result.error?.isRetryable})`
      );

      if (result.error?.isRetryable === false) {
        // Non-retryable failure: mark as failed
        request.markAsFailed(result.error.message);
        await this.outboxRepo.update(request);
      } else {
        // Retryable failure: reset to pending for retry
        request.status = "pending";
        request.lastError = result.error?.message;
        await this.outboxRepo.update(request);
      }

      return;
    }

    // 5. Process completed job
    try {
      // Check if result already exists (duplicate delivery)
      const existingResult = await this.resultRepo.findByRequestId(result.requestId);
      if (existingResult) {
        this.logger.log(`Result already exists for request ${result.requestId}, marking as completed`);
        request.markAsCompleted();
        await this.outboxRepo.update(request);
        return; // Idempotent: unique constraint prevents duplicates
      }

      // Reload ballot (may have changed since request was created)
      const currentBallot = await this.ballotRepo.findById(request.ballotId);
      if (!currentBallot) {
        throw createBallotNotFoundError();
      }

      // Validate worker result against ballot's layout
      const validationResult = this.validator.validate(
        result.data!.qrVerified,
        result.data!.selections,
        currentBallot.layoutMetadata,
        result.data!.processingMetadata
      );

      // Create and save scan result with validation status
      const scanResult = BallotScanResult.create({
        requestId: result.requestId,
        ballotId: request.ballotId,
        userId: request.userId,
        s3Key: request.s3Key,
        selections: result.data!.selections,
        qrVerified: result.data!.qrVerified,
        processingMetadata: result.data!.processingMetadata,
        validationStatus: validationResult.status,
        validationErrors: validationResult.errors.length > 0 ? validationResult.errors : undefined
      });

      await this.resultRepo.save(scanResult);

      // If valid, check election is still active before marking ballot as voted
      if (validationResult.isValid && !currentBallot.isVoted()) {
        // Re-check election status (race condition: election may have closed during processing)
        const election = await this.queryBus.execute(
          new GetElectionStatusQuery({ electionId: currentBallot.electionId })
        );

        if (election.isActive) {
          currentBallot.markAsVoted();
          await this.ballotRepo.update(currentBallot);
          this.logger.log(`Ballot ${request.ballotId} marked as voted`);
        } else {
          // Election closed during processing - create new scan result with rejection status
          this.logger.warn(
            `Ballot ${request.ballotId} scan rejected: election is no longer active (status: ${election.status})`
          );

          // Delete the valid result we just saved
          await this.resultRepo.deleteByRequestId(result.requestId);

          // Create and save a new result with rejected status
          const rejectedResult = BallotScanResult.create({
            requestId: result.requestId,
            ballotId: request.ballotId,
            userId: request.userId,
            s3Key: request.s3Key,
            selections: result.data!.selections,
            qrVerified: result.data!.qrVerified,
            processingMetadata: result.data!.processingMetadata,
            validationStatus: "rejected_election_closed",
            validationErrors: [{ reason: "Election is no longer active" }]
          });

          await this.resultRepo.save(rejectedResult);
        }
      } else if (!validationResult.isValid) {
        this.logger.warn(
          `Ballot ${request.ballotId} scan validation failed: ${validationResult.status}`,
          validationResult.errors
        );
      }

      // Mark request as completed
      request.markAsCompleted();
      await this.outboxRepo.update(request);

      this.logger.log(`OMR result processed successfully for request ${result.requestId}`);
    } catch (error) {
      // Only throw on transient errors (DB down, network issues)
      // Business validation failures are stored in validationStatus
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Transient error processing result for request ${result.requestId}: ${errorMessage}`);
      throw error; // Will be retried by BullMQ
    }
  }
}
