import { Command } from "@nestjs/cqrs";

export type GetUploadUrlCommandPayload = {
  ballotId: string;
  contentType: string;
};

export type GetUploadUrlCommandResult = {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
};

export class GetUploadUrlCommand extends Command<GetUploadUrlCommandResult> {
  constructor(public readonly payload: GetUploadUrlCommandPayload) {
    super();
  }
}
