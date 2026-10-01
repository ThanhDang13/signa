import { Injectable, Logger } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { QueuePublisher } from "@signa/nest-queue";
import { generateBallotJob } from "@signa/contracts-queue/ballot";
import {
  BALLOT_GENERATION_OUTBOX_REPOSITORY,
  type BallotGenerationOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  BALLOT_REPOSITORY,
  type BallotRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { Ballot } from "@signa/api/modules/ballot/domain/entities/ballot";
import { createHmac } from "crypto";
import { InjectConfig } from "@signa/nest-config";
import { APP_CONFIG, type AppConfig } from "@signa/api/core/config/tokens";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;

@Injectable()
export class BallotGenerationOutboxScheduler {
  private readonly logger = new Logger(BallotGenerationOutboxScheduler.name);

  constructor(
    @Inject(BALLOT_GENERATION_OUTBOX_REPOSITORY)
    private readonly outboxRepo: BallotGenerationOutboxRepository,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository,
    @Inject(ELECTION_REPOSITORY)
    private readonly electionRepo: ElectionRepository,
    @InjectConfig(APP_CONFIG)
    private readonly config: AppConfig,
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

        // Fetch election data
        const election = await this.electionRepo.findById(request.electionId);
        if (!election) {
          throw createElectionNotFoundError();
        }

        // Generate signatures for all ballots in the batch
        const ballots = request.ballotIds.map((ballotId) => ({
          ballotId,
          signature: {
            signature: this.generateSignature(ballotId),
            timestamp: request.timestamp.toISOString()
          }
        }));

        // Publish batch to queue and wait for result (synchronous generation)
        try {
          const data = await this.queuePublisher.publishAndWait(
            generateBallotJob,
            {
              electionId: request.electionId,
              timestamp: request.timestamp.toISOString(),
              formStructure: election.formStructure,
              ballots
            },
            {
              timeout: 60000 // 60 seconds for ballot generation
            }
          );

          // Create and save all ballots when generation completes
          const ballotEntities = data.ballots.map((ballotData) => {
            const ballot = Ballot.create({
              electionId: request.electionId,
              signature: ballotData.signature,
              qrCodeData: ballotData.qrCodeData,
              pdfS3Key: data.batchPdfS3Key,
              layoutMetadata: ballotData.layout
            });

            // Override the generated ID with the one from the batch
            (ballot as any).id = { value: ballotData.ballotId, toString: () => ballotData.ballotId };

            return ballot;
          });

          await Promise.all(ballotEntities.map((ballot) => this.ballotRepo.save(ballot)));

          request.markAsCompleted();
          await this.outboxRepo.update(request);
          this.logger.log(`Batch of ${data.ballots.length} ballot(s) generated successfully`);
        } catch (jobError) {
          const jobErrorMessage = jobError instanceof Error ? jobError.message : String(jobError);
          request.markAsFailed(jobErrorMessage);
          await this.outboxRepo.update(request);
          this.logger.error(`Ballot batch generation failed: ${jobErrorMessage}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        request.markAsFailed(errorMessage);
        await this.outboxRepo.update(request);
      }
    }
  }

  private generateSignature(ballotId: string): string {
    // Signature data is just the ballotId (timestamp removed to reduce QR size)
    const hmac = createHmac("sha256", this.config.ballotSecret);
    hmac.update(ballotId);
    return hmac.digest("hex");
  }
}
