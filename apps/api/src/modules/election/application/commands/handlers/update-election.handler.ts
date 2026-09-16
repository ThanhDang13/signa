import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateElectionCommand } from "@signa/api/modules/election/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@CommandHandler(UpdateElectionCommand)
export class UpdateElectionHandler implements ICommandHandler<UpdateElectionCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(command: UpdateElectionCommand) {
    const { id, title, description, formStructure, startDate, endDate, maxVoters } =
      command.payload;

    const election = await this.elections.findById(id);
    if (!election) {
      throw createElectionNotFoundError();
    }

    if (title || description !== undefined || formStructure) {
      election.updateDetails(title ?? election.title, description, formStructure);
    }

    if (startDate !== undefined || endDate !== undefined) {
      election.updateSchedule(startDate, endDate);
    }

    if (maxVoters !== undefined) {
      election.maxVoters = maxVoters;
    }

    await this.elections.save(election);

    return {
      message: "Election updated successfully"
    };
  }
}
