import { Command } from "@nestjs/cqrs";
import type { FormStructure } from "@signa/shared";

export type PreviewBallotCommandPayload = {
  electionId: string;
  formStructure: FormStructure;
};

export type PreviewBallotCommandResult = {
  pdfUrl: string;
  expiresAt: string;
};

export class PreviewBallotCommand extends Command<PreviewBallotCommandResult> {
  constructor(public readonly payload: PreviewBallotCommandPayload) {
    super();
  }
}
