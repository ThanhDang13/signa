import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ProcessBallotScanCommand } from "@signa/api/modules/ballot/application/commands";
import {
  BALLOT_REPOSITORY,
  type BallotRepository
} from "@signa/api/modules/ballot/application/ports";
import {
  OMR_PROCESSING_OUTBOX_REPOSITORY,
  type OmrProcessingOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import { OmrProcessingRequest } from "@signa/api/modules/ballot/domain/entities";
import { createBallotNotFoundError } from "@signa/api/modules/ballot/application/errors";

@CommandHandler(ProcessBallotScanCommand)
export class ProcessBallotScanHandler implements ICommandHandler<ProcessBallotScanCommand> {
  constructor(
    @Inject(BALLOT_REPOSITORY) private readonly ballots: BallotRepository,
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository
  ) {}

  async execute(command: ProcessBallotScanCommand) {
    const { ballotId, s3Key } = command.payload;

    // Verify ballot exists
    const ballot = await this.ballots.findById(ballotId);
    if (!ballot) {
      throw createBallotNotFoundError();
    }

    // Create OMR processing request
    const request = OmrProcessingRequest.create({
      ballotId,
      s3Key
    });

    // Save to outbox (scheduler will pick it up)
    await this.outboxRepo.save(request);

    return {
      message: "OMR processing request saved to outbox",
      requestId: request.id
    };
  }
}
