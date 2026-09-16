import { Command } from "@nestjs/cqrs";

export type ActivateElectionCommandPayload = {
  id: string;
};

export type ActivateElectionCommandResult = {
  message: string;
};

export class ActivateElectionCommand extends Command<ActivateElectionCommandResult> {
  constructor(public readonly payload: ActivateElectionCommandPayload) {
    super();
  }
}
