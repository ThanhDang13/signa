import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GenerateBallotsCommand } from "@signa/api/modules/ballot/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import {
  BALLOT_GENERATION_OUTBOX_REPOSITORY,
  type BallotGenerationOutboxRepository
} from "@signa/api/modules/ballot/application/ports";
import { BallotGenerationRequest } from "@signa/api/modules/ballot/domain/entities";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";
import { v7 as uuidv7 } from "uuid";

@CommandHandler(GenerateBallotsCommand)
export class GenerateBallotsHandler implements ICommandHandler<GenerateBallotsCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository,
    @Inject(BALLOT_GENERATION_OUTBOX_REPOSITORY)
    private readonly outboxRepo: BallotGenerationOutboxRepository
  ) {}

  async execute(command: GenerateBallotsCommand) {
    const { electionId, count } = command.payload;

    // Verify election exists
    const election = await this.elections.findById(electionId);
    if (!election) {
      throw createElectionNotFoundError();
    }

    // Create a single batch request with all ballot IDs
    const ballotIds = Array.from({ length: count }, () => uuidv7());

    const batchRequest = BallotGenerationRequest.create({
      electionId,
      ballotIds
    });

    // Save batch request to outbox (transactional)
    await this.outboxRepo.save(batchRequest);

    // Outbox processor will poll and publish to queue as a single batch job
    return {
      message: `Batch request for ${count} ballot(s) saved to outbox`,
      jobsEnqueued: 1 // Single batch job instead of N individual jobs
    };
  }
}
