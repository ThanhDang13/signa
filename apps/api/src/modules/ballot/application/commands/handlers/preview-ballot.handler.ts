import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, Injectable } from "@nestjs/common";
import { PreviewBallotCommand } from "@signa/api/modules/ballot/application/commands";
import { QueuePublisher } from "@signa/nest-queue";
import { generateBallotJob } from "@signa/contracts-queue/ballot";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { v7 as uuidv7 } from "uuid";
import { createHmac } from "crypto";
import { InjectConfig } from "@signa/nest-config";
import { APP_CONFIG, type AppConfig } from "@signa/api/core/config/tokens";
import { BallotId } from "@signa/api/modules/ballot/domain/value-objects";

@CommandHandler(PreviewBallotCommand)
export class PreviewBallotHandler implements ICommandHandler<PreviewBallotCommand> {
  constructor(
    private readonly queuePublisher: QueuePublisher,
    @Inject(S3_SERVICE)
    private readonly s3: S3Service,
    @InjectConfig(APP_CONFIG)
    private readonly config: AppConfig
  ) {}

  async execute(command: PreviewBallotCommand) {
    const { electionId, formStructure } = command.payload;

    // Generate a sample ballot ID for preview
    const sampleBallotId = BallotId.create().toString();
    const signature = this.generateSignature(sampleBallotId);

    // Publish preview ballot generation job and wait for completion
    const result = await this.queuePublisher.publishAndWait(generateBallotJob, {
      electionId,
      timestamp: new Date().toISOString(),
      formStructure,
      ballots: [
        {
          ballotId: sampleBallotId,
          signature: {
            signature,
            timestamp: new Date().toISOString()
          }
        }
      ]
    });

    // Generate presigned download URL for the preview PDF (expires in 1 hour)
    const expiresIn = 3600; // 1 hour in seconds
    const pdfUrl = await this.s3.getPresignedDownloadUrl(result.batchPdfS3Key, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      pdfUrl,
      expiresAt: expiresAt.toISOString()
    };
  }

  private generateSignature(ballotId: string): string {
    const hmac = createHmac("sha256", this.config.ballotSecret);
    hmac.update(ballotId);
    return hmac.digest("hex");
  }
}
