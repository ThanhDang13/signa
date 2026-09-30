import { Command } from "@nestjs/cqrs";

export type RetryBallotScanCommandPayload = {
  requestId: string;
  s3Key: string;
  userId: string;
};

export type RetryBallotScanCommandResult = {
  message: string;
  requestId: string;
};

export class RetryBallotScanCommand extends Command<RetryBallotScanCommandResult> {
  constructor(public readonly payload: RetryBallotScanCommandPayload) {
    super();
  }
}
