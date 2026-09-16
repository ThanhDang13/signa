import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ActivateElectionCommand } from "@signa/api/modules/election/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@CommandHandler(ActivateElectionCommand)
export class ActivateElectionHandler implements ICommandHandler<ActivateElectionCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(command: ActivateElectionCommand) {
    const { id } = command.payload;

    const election = await this.elections.findById(id);
    if (!election) {
      throw createElectionNotFoundError();
    }

    election.activate();
    await this.elections.save(election);

    return {
      message: "Election activated successfully"
    };
  }
}
