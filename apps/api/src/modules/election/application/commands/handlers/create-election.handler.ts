import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateElectionCommand } from "@signa/api/modules/election/application/commands";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { Election } from "@signa/api/modules/election/domain/entities";

@CommandHandler(CreateElectionCommand)
export class CreateElectionHandler implements ICommandHandler<CreateElectionCommand> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(command: CreateElectionCommand) {
    const { title, description, formStructure, startDate, endDate, maxVoters, createdById } =
      command.payload;

    const election = Election.create({
      title,
      description,
      formStructure,
      startDate,
      endDate,
      maxVoters,
      createdById
    });

    await this.elections.save(election);

    return {
      id: election.id.toString(),
      message: "Election created successfully"
    };
  }
}
