import { Module } from "@nestjs/common";
import { QueueModule } from "@signa/nest-queue";
import { S3Module } from "@signa/worker/core/s3";
import { OmrProcessingProcessor } from "./processors/omr-processing.processor";
import { processBallotJob } from "@signa/contracts-queue/scanning";
import { BallotImageRepository } from "./services/ballot-image.repository";
import { ArucoAlignmentService } from "./services/aruco-alignment.service";
import { QrVerificationService } from "./services/qr-verification.service";
import { MarkDetectionService } from "./services/mark-detection.service";
import { OpenCvService } from "./services/opencv.service";

@Module({
  imports: [
    S3Module,
    QueueModule.registerQueue(processBallotJob.queue)
  ],
  providers: [
    OpenCvService,
    OmrProcessingProcessor,
    BallotImageRepository,
    ArucoAlignmentService,
    QrVerificationService,
    MarkDetectionService
  ]
})
export class ScanningModule {}
