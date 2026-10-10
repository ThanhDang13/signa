import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetScanRequestQuery } from "@signa/api/modules/ballot/application/queries";
import {
  createScanRequestNotFoundError,
  createScanRequestForbiddenError
} from "@signa/api/modules/ballot/application/errors";

const S3_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

@QueryHandler(GetScanRequestQuery)
export class GetScanRequestHandler implements IQueryHandler<GetScanRequestQuery> {
  constructor(
    @InjectDatabase() private readonly db: DrizzleDatabase,
    @Inject(S3_SERVICE) private readonly s3Service: S3Service
  ) {}

  async execute(query: GetScanRequestQuery) {
    const { requestId, userId } = query.payload;

    // Query outbox with LEFT JOIN to result
    const rows = await this.db
      .select({
        // Outbox fields
        id: schemas.omrProcessingOutbox.id,
        ballotId: schemas.omrProcessingOutbox.ballotId,
        electionId: schemas.omrProcessingOutbox.electionId,
        userId: schemas.omrProcessingOutbox.userId,
        s3Key: schemas.omrProcessingOutbox.s3Key,
        status: schemas.omrProcessingOutbox.status,
        attempts: schemas.omrProcessingOutbox.attempts,
        lastError: schemas.omrProcessingOutbox.lastError,
        processedAt: schemas.omrProcessingOutbox.processedAt,
        createdAt: schemas.omrProcessingOutbox.createdAt,
        updatedAt: schemas.omrProcessingOutbox.updatedAt,
        // Result fields (nullable)
        resultValidationStatus: schemas.ballotScanResults.validationStatus,
        resultQrVerified: schemas.ballotScanResults.qrVerified,
        resultSelections: schemas.ballotScanResults.selections,
        resultProcessingMetadata: schemas.ballotScanResults.processingMetadata,
        resultValidationErrors: schemas.ballotScanResults.validationErrors,
        resultProcessedAt: schemas.ballotScanResults.processedAt
      })
      .from(schemas.omrProcessingOutbox)
      .leftJoin(
        schemas.ballotScanResults,
        eq(schemas.ballotScanResults.requestId, schemas.omrProcessingOutbox.id)
      )
      .where(eq(schemas.omrProcessingOutbox.id, requestId))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw createScanRequestNotFoundError();
    }

    // Ownership check
    if (row.userId !== userId) {
      throw createScanRequestForbiddenError();
    }

    // Generate S3 URL on-demand
    const s3Url = await this.s3Service.getPresignedDownloadUrl(row.s3Key, S3_URL_EXPIRY);

    // Build response
    const response: any = {
      requestId: row.id,
      ballotId: row.ballotId,
      electionId: row.electionId,
      status: row.status,
      s3Url, // Generated on-demand
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };

    // If result exists, include it
    if (row.resultValidationStatus) {
      response.result = {
        validationStatus: row.resultValidationStatus,
        qrVerified: row.resultQrVerified,
        selections: row.resultSelections,
        processingMetadata: row.resultProcessingMetadata,
        processedAt: row.resultProcessedAt
      };
    }

    if (row.processedAt) {
      response.processedAt = row.processedAt;
    }

    return response;
  }
}
