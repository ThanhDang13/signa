import { Injectable, Logger } from "@nestjs/common";
import { ContractWorker, JobHandler, Processor } from "@signa/nest-queue";
import { generateBallotJob } from "@signa/contracts-queue/ballot";
import type { Job } from "bullmq";
import type { InferJobData, InferJobResult } from "@signa/dsl-queue-contract";
import { QrCodeGenerationService } from "@signa/worker/modules/ballot/services/qr-code-generation.service";
import { BallotPdfGenerationService } from "@signa/worker/modules/ballot/services/ballot-pdf-generation.service";
import { BallotPdfRepository } from "@signa/worker/modules/ballot/services/ballot-pdf.repository";

@Processor(generateBallotJob.queue)
export class BallotGenerationProcessor extends ContractWorker {
  private readonly logger = new Logger(BallotGenerationProcessor.name);

  constructor(
    private readonly qrService: QrCodeGenerationService,
    private readonly pdfService: BallotPdfGenerationService,
    private readonly pdfRepo: BallotPdfRepository
  ) {
    super();
  }

  @JobHandler(generateBallotJob)
  async handleGenerateBallot(
    job: Job<InferJobData<typeof generateBallotJob>>
  ): Promise<InferJobResult<typeof generateBallotJob>> {
    const { electionId, ballots, formStructure } = job.data;

    this.logger.log(`Generating ${ballots.length} ballot(s) for election ${electionId}`);

    try {
      // Step 1: Generate QR code data URLs for all ballots
      const ballotsWithQr = await Promise.all(
        ballots.map(async ({ ballotId, signature }) => {
          const qrCodeDataUrl = await this.qrService.generate({
            ballotId,
            signature: signature.signature
          });
          return { ballotId, signature, qrCodeDataUrl };
        })
      );

      // Step 2: Generate multi-page PDF and collect layout metadata for each ballot
      const { pdfBuffer, ballots: ballotLayouts } = await this.pdfService.generateBatch(
        formStructure,
        ballotsWithQr.map(({ ballotId, qrCodeDataUrl }) => ({ ballotId, qrCodeDataUrl }))
      );

      // Step 3: Upload batch PDF to S3
      const batchId = `batch-${Date.now()}`;
      const batchPdfS3Key = await this.pdfRepo.upload(electionId, batchId, pdfBuffer);

      this.logger.log(`Batch of ${ballots.length} ballot(s) generated and uploaded successfully`);

      // Step 4: Combine metadata from all sources
      const resultBallots = ballotLayouts.map((ballotLayout) => {
        const ballotData = ballotsWithQr.find((b) => b.ballotId === ballotLayout.ballotId)!;
        return {
          ballotId: ballotLayout.ballotId,
          signature: ballotData.signature,
          qrCodeData: JSON.stringify({
            ballotId: ballotLayout.ballotId,
            signature: ballotData.signature.signature
          }),
          layout: ballotLayout.layout,
          pageNumber: ballotLayout.pageNumber
        };
      });

      return {
        batchPdfS3Key,
        ballots: resultBallots
      };
    } catch (error) {
      this.logger.error(`Failed to generate ballot batch for election ${electionId}:`, error);
      throw error;
    }
  }
}
