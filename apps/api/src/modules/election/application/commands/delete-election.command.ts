import { Command } from "@nestjs/cqrs";

export type DeleteElectionCommandPayload = {
  id: string;
};

export type DeleteElectionCommandResult = {
  message: string;
};

export class DeleteElectionCommand extends Command<DeleteElectionCommandResult> {
  constructor(public readonly payload: DeleteElectionCommandPayload) {
    super();
  }
}
