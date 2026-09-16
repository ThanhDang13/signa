import { Command } from "@nestjs/cqrs";

export type CloseElectionCommandPayload = {
  id: string;
};

export type CloseElectionCommandResult = {
  message: string;
};

export class CloseElectionCommand extends Command<CloseElectionCommandResult> {
  constructor(public readonly payload: CloseElectionCommandPayload) {
    super();
  }
}
