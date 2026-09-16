import { Command } from "@nestjs/cqrs";
import type { FormStructure } from "@signa/shared";

export type UpdateElectionCommandPayload = {
  id: string;
  title?: string;
  description?: string;
  formStructure?: FormStructure;
  startDate?: Date;
  endDate?: Date;
  maxVoters?: number;
};

export type UpdateElectionCommandResult = {
  message: string;
};

export class UpdateElectionCommand extends Command<UpdateElectionCommandResult> {
  constructor(public readonly payload: UpdateElectionCommandPayload) {
    super();
  }
}
