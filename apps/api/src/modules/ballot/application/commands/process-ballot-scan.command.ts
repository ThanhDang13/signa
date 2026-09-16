import { Command } from "@nestjs/cqrs";

export type ProcessBallotScanCommandPayload = {
  ballotId: string;
  s3Key: string;
};

export type ProcessBallotScanCommandResult = {
  message: string;
  requestId: string;
};

export class ProcessBallotScanCommand extends Command<ProcessBallotScanCommandResult> {
  constructor(public readonly payload: ProcessBallotScanCommandPayload) {
    super();
  }
}
