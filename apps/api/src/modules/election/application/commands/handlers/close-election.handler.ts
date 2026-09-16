import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CloseElectionCommand } from "@signa/api/modules/election/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@CommandHandler(CloseElectionCommand)
export class CloseElectionHandler implements ICommandHandler<CloseElectionCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(command: CloseElectionCommand) {
    const { id } = command.payload;

    const election = await this.elections.findById(id);
    if (!election) {
      throw createElectionNotFoundError();
    }

    election.close();
    await this.elections.save(election);

    return {
      message: "Election closed successfully"
    };
  }
}
