import { Inject, Logger } from "@nestjs/common";
import { ContractWorker, JobHandler, Processor } from "@signa/nest-queue";
import { processBallotJob } from "@signa/contracts-queue/scanning";
import type { Job } from "bullmq";
import type { InferJobData, InferJobResult } from "@signa/dsl-queue-contract";
import sharp from "sharp";
import { InjectConfig } from "@signa/nest-config";
import { APP_CONFIG, type AppConfig } from "@signa/worker/core/config/tokens";
import { BallotImageRepository } from "@signa/worker/modules/scanning/services/ballot-image.repository";
import { ArucoAlignmentService } from "@signa/worker/modules/scanning/services/aruco-alignment.service";
import { QrVerificationService } from "@signa/worker/modules/scanning/services/qr-verification.service";
import { MarkDetectionService } from "@signa/worker/modules/scanning/services/mark-detection.service";
import { OpenCvService, type CvMat } from "@signa/worker/modules/scanning/services/opencv.service";

@Processor(processBallotJob.queue)
export class OmrProcessingProcessor extends ContractWorker {
  private readonly logger = new Logger(OmrProcessingProcessor.name);

  constructor(
    private readonly ballotImageRepo: BallotImageRepository,
    private readonly alignmentService: ArucoAlignmentService,
    private readonly qrService: QrVerificationService,
    private readonly markService: MarkDetectionService,
    private readonly openCvService: OpenCvService,
    @InjectConfig(APP_CONFIG)
    private readonly config: AppConfig
  ) {
    super();
  }

  @JobHandler(processBallotJob)
  async handleProcessBallot(
    job: Job<InferJobData<typeof processBallotJob>>
  ): Promise<InferJobResult<typeof processBallotJob>> {
    const { s3Key, ballotId, layout } = job.data;

    this.logger.log(`Processing ballot scan ${ballotId} from S3 key: ${s3Key}`);

    let alignedMat: CvMat | null = null;

    try {
      // Step 1: Load image from S3
      const imageBuffer = await this.ballotImageRepo.download(s3Key);
      const srcImage = sharp(imageBuffer);

      // Get image dimensions
      const metadata = await srcImage.metadata();
      const imageWidth = metadata.width!;
      const imageHeight = metadata.height!;

      this.logger.debug(`Image loaded: ${imageWidth}x${imageHeight}`);

      // Step 2: Convert to RGBA for ArUco detection
      const rgbaBuffer = await srcImage.ensureAlpha().raw().toBuffer();

      // Step 3: Detect ArUco markers and apply perspective correction FIRST
      // This corrects any skew/rotation/perspective distortion in the scanned image
      const { alignedImage, markersDetected } = await this.alignmentService.align(
        rgbaBuffer,
        imageWidth,
        imageHeight,
        layout
      );
      alignedMat = alignedImage;

      const alignmentApplied = markersDetected && alignedMat !== null;

      if (!alignmentApplied) {
        this.logger.warn("ArUco markers not detected - cannot reliably scan QR or marks");
        return {
          ballotId,
          selections: [],
          qrVerified: false,
          processingMetadata: {
            markersDetected: false,
            alignmentApplied: false
          }
        };
      }

      // TypeScript refinement: after the check above, alignedMat is guaranteed to be non-null
      const alignedMatNonNull = alignedMat!;

      // Step 4: Extract grayscale data from aligned image for QR scanning and mark detection
      const aligned = this.matToRawData(alignedMatNonNull);
      const processingData = aligned.data;
      const processingWidth = aligned.width;
      const processingHeight = aligned.height;

      // Step 5: Verify QR code from aligned image
      // QR position is now accurate because perspective correction has been applied
      const qrVerified = await this.qrService.verify(
        processingData,
        processingWidth,
        processingHeight,
        ballotId,
        this.config.ballotSecret,
        layout.qrCode
      );

      // Step 6: Detect marks at checkbox/radio positions
      const selections = await this.markService.detect(
        processingData,
        processingWidth,
        processingHeight,
        layout.fields
      );

      return {
        ballotId,
        selections,
        qrVerified,
        processingMetadata: {
          markersDetected,
          alignmentApplied
        }
      };
    } catch (error) {
      this.logger.error(`Failed to process ballot ${ballotId}:`, error);
      throw error;
    } finally {
      // Clean up OpenCV matrices
      alignedMat?.delete();
    }
  }

  /**
   * Convert OpenCV Mat to raw pixel data buffer
   */
  private matToRawData(mat: CvMat): { data: Buffer; width: number; height: number } {
    const cv = this.openCvService.getCv();
    const width = mat.cols;
    const height = mat.rows;

    // Ensure single channel (grayscale)
    let grayMat = mat;
    if (mat.channels() > 1) {
      grayMat = new cv.Mat();
      cv.cvtColor(mat, grayMat, cv.COLOR_BGR2GRAY);
    }

    const data = Buffer.from(grayMat.data);

    if (mat.channels() > 1) {
      grayMat.delete();
    }

    return { data, width, height };
  }
}
