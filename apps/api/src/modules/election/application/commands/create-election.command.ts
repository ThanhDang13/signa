import { Command } from "@nestjs/cqrs";
import type { FormStructure } from "@signa/shared";

export type CreateElectionCommandPayload = {
  title: string;
  description?: string;
  formStructure: FormStructure;
  startDate?: Date;
  endDate?: Date;
  maxVoters?: number;
  createdById: string;
};

export type CreateElectionCommandResult = {
  id: string;
  message: string;
};

export class CreateElectionCommand extends Command<CreateElectionCommandResult> {
  constructor(public readonly payload: CreateElectionCommandPayload) {
    super();
  }
}
