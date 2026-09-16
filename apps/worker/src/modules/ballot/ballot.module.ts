import { Module } from "@nestjs/common";
import { QueueModule } from "@signa/nest-queue";
import { S3Module } from "@signa/worker/core/s3";
import { BallotGenerationProcessor } from "./processors/ballot-generation.processor";
import { generateBallotJob } from "@signa/contracts-queue/ballot";
import { QrCodeGenerationService } from "./services/qr-code-generation.service";
import { ArucoMarkerDrawingService } from "./services/aruco-marker-drawing.service";
import { FormFieldRenderingService } from "./services/form-field-rendering.service";
import { BallotPdfGenerationService } from "./services/ballot-pdf-generation.service";
import { BallotPdfRepository } from "./services/ballot-pdf.repository";

@Module({
  imports: [
    S3Module,
    QueueModule.registerQueue(generateBallotJob.queue)
  ],
  providers: [
    BallotGenerationProcessor,
    QrCodeGenerationService,
    ArucoMarkerDrawingService,
    FormFieldRenderingService,
    BallotPdfGenerationService,
    BallotPdfRepository
  ]
})
export class BallotModule {}
