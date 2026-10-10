import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  GetBallotBatchDownloadQuery,
  type GetBallotBatchDownloadQueryResult
} from "../get-ballot-batch-download.query";
import {
  createBallotBatchNotFoundError,
  createBallotBatchPdfNotReadyError
} from "@signa/api/modules/ballot/application/errors";

const S3_URL_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

@QueryHandler(GetBallotBatchDownloadQuery)
export class GetBallotBatchDownloadHandler implements IQueryHandler<GetBallotBatchDownloadQuery> {
  constructor(
    @InjectDatabase() private readonly db: DrizzleDatabase,
    @Inject(S3_SERVICE) private readonly s3Service: S3Service
  ) {}

  async execute(query: GetBallotBatchDownloadQuery): Promise<GetBallotBatchDownloadQueryResult> {
    const { batchId } = query.payload;

    const rows = await this.db
      .select()
      .from(schemas.ballotGenerationOutbox)
      .where(eq(schemas.ballotGenerationOutbox.id, batchId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw createBallotBatchNotFoundError();
    }

    // Check if batch has completed and has PDF
    if (!row.batchPdfS3Key) {
      throw createBallotBatchPdfNotReadyError();
    }

    // Generate presigned download URL
    const downloadUrl = await this.s3Service.getPresignedDownloadUrl(
      row.batchPdfS3Key,
      S3_URL_EXPIRY
    );

    return {
      downloadUrl,
      expiresIn: S3_URL_EXPIRY
    };
  }
}
