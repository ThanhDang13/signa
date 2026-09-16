import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUploadUrlCommand } from "../get-upload-url.command";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { BALLOT_REPOSITORY, type BallotRepository } from "../../ports";
import { createBallotNotFoundError } from "../../errors";

@CommandHandler(GetUploadUrlCommand)
export class GetUploadUrlHandler implements ICommandHandler<GetUploadUrlCommand> {
  constructor(
    @Inject(S3_SERVICE)
    private readonly s3: S3Service,
    @Inject(BALLOT_REPOSITORY)
    private readonly ballotRepo: BallotRepository
  ) {}

  async execute(command: GetUploadUrlCommand) {
    const { ballotId, contentType } = command.payload;

    // Verify ballot exists
    const ballot = await this.ballotRepo.findById(ballotId);
    if (!ballot) {
      throw createBallotNotFoundError();
    }

    // Generate S3 key for the scan
    const timestamp = Date.now();
    const s3Key = `scans/${ballot.electionId}/${ballotId}/${timestamp}.jpg`;

    // Generate presigned URL (15 minutes expiry)
    const expiresIn = 900; // 15 minutes in seconds
    const uploadUrl = await this.s3.getPresignedUploadUrl(s3Key, expiresIn);

    return {
      uploadUrl,
      s3Key,
      expiresIn
    };
  }
}
