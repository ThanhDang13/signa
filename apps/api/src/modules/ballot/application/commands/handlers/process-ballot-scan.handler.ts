import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
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
import {
  createBallotNotFoundError,
  createBallotAlreadyVotedError,
  createScanAlreadyActiveError,
  createScanAlreadyTerminalError
} from "@signa/api/modules/ballot/application/errors";
import { GetElectionStatusQuery } from "@signa/api/modules/election/application/queries";
import { createElectionNotActiveError } from "@signa/api/modules/election/application/errors";

@CommandHandler(ProcessBallotScanCommand)
export class ProcessBallotScanHandler implements ICommandHandler<ProcessBallotScanCommand> {
  constructor(
    @Inject(BALLOT_REPOSITORY) private readonly ballots: BallotRepository,
    @Inject(OMR_PROCESSING_OUTBOX_REPOSITORY)
    private readonly outboxRepo: OmrProcessingOutboxRepository,
    private readonly queryBus: QueryBus
  ) {}

  async execute(command: ProcessBallotScanCommand) {
    const { ballotId, s3Key, userId } = command.payload;

    // 1. Verify ballot exists
    const ballot = await this.ballots.findById(ballotId);
    if (!ballot) {
      throw createBallotNotFoundError();
    }

    // 2. Check election status - only allow scan processing for active elections
    const election = await this.queryBus.execute(
      new GetElectionStatusQuery({ electionId: ballot.electionId })
    );

    if (!election.isActive) {
      throw createElectionNotActiveError();
    }

    // 3. Reject if ballot already voted
    if (ballot.isVoted()) {
      throw createBallotAlreadyVotedError();
    }

    // 3. Reject if ballot already voted
    if (ballot.isVoted()) {
      throw createBallotAlreadyVotedError();
    }

    // 4. Check for existing scan request by ballot ID (global duplicate check)
    const existingRequest = await this.outboxRepo.findByBallotId(ballotId);

    if (existingRequest) {
      // 4a. Reject if request is active
      if (existingRequest.isActive()) {
        throw createScanAlreadyActiveError();
      }

      // 4b. If terminal, instruct client to retry the existing request
      if (existingRequest.isTerminal()) {
        throw createScanAlreadyTerminalError(existingRequest.id);
      }
    }

    // 5. Create new OMR processing request
    const request = OmrProcessingRequest.create({
      ballotId,
      userId,
      s3Key
    });

    // 5. Save to outbox (scheduler will pick it up)
    await this.outboxRepo.save(request);

    return {
      message: "OMR processing request saved to outbox",
      requestId: request.id
    };
  }
}
