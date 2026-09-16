import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteElectionCommand } from "@signa/api/modules/election/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@CommandHandler(DeleteElectionCommand)
export class DeleteElectionHandler implements ICommandHandler<DeleteElectionCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(command: DeleteElectionCommand) {
    const { id } = command.payload;

    const election = await this.elections.findById(id);
    if (!election) {
      throw createElectionNotFoundError();
    }

    await this.elections.delete(id);

    return {
      message: "Election deleted successfully"
    };
  }
}
