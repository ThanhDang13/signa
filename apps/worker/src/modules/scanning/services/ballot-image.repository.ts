import { Inject, Injectable } from "@nestjs/common";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";

/**
 * Repository for ballot image storage operations
 * Handles S3 upload/download for ballot images
 */
@Injectable()
export class BallotImageRepository {
  constructor(
    @Inject(S3_SERVICE)
    private readonly s3: S3Service
  ) {}

  /**
   * Download a ballot image from S3
   * @param s3Key - S3 object key
   * @returns Image buffer
   */
  async download(s3Key: string): Promise<Buffer> {
    return this.s3.download(s3Key);
  }

  /**
   * Upload a ballot image to S3
   * @param s3Key - S3 object key
   * @param buffer - Image buffer
   * @param contentType - MIME type
   */
  async upload(s3Key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.s3.upload(s3Key, buffer, { contentType });
  }
}
