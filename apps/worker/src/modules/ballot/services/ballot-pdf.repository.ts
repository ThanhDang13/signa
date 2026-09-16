import { Inject, Injectable } from "@nestjs/common";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";

/**
 * Repository for ballot PDF storage operations
 * Handles S3 upload for generated ballot PDFs
 */
@Injectable()
export class BallotPdfRepository {
  constructor(
    @Inject(S3_SERVICE)
    private readonly s3: S3Service
  ) {}

  /**
   * Upload a ballot PDF to S3
   * @param electionId - Election identifier for organizing ballots
   * @param ballotId - Unique ballot identifier
   * @param pdfBuffer - PDF file buffer
   * @returns S3 key where the PDF was stored
   */
  async upload(electionId: string, ballotId: string, pdfBuffer: Buffer): Promise<string> {
    const pdfKey = `ballots/${electionId}/${ballotId}.pdf`;

    await this.s3.upload(pdfKey, pdfBuffer, {
      contentType: "application/pdf"
    });

    return pdfKey;
  }
}
