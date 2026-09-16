import { Command } from "@nestjs/cqrs";

export type GenerateBallotsCommandPayload = {
  electionId: string;
  count: number;
};

export type GenerateBallotsCommandResult = {
  message: string;
  jobsEnqueued: number;
};

export class GenerateBallotsCommand extends Command<GenerateBallotsCommandResult> {
  constructor(public readonly payload: GenerateBallotsCommandPayload) {
    super();
  }
}
