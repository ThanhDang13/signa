import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { S3_SERVICE, type S3Service } from "@signa/nest-s3";
import { eq, and, sql, desc } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { ListScanRequestsQuery } from "@signa/api/modules/ballot/application/queries";

const S3_URL_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

@QueryHandler(ListScanRequestsQuery)
export class ListScanRequestsHandler implements IQueryHandler<ListScanRequestsQuery> {
  constructor(
    @InjectDatabase() private readonly db: DrizzleDatabase,
    @Inject(S3_SERVICE) private readonly s3Service: S3Service
  ) {}

  async execute(query: ListScanRequestsQuery) {
    const { userId, pageIndex, pageSize, status } = query.payload;
    const offset = pageIndex * pageSize;

    // Build where conditions
    const conditions = [eq(schemas.omrProcessingOutbox.userId, userId)];
    if (status === "completed") {
      conditions.push(eq(schemas.omrProcessingOutbox.status, "completed"));
    } else if (status === "failed") {
      conditions.push(eq(schemas.omrProcessingOutbox.status, "failed"));
    } else if (status === "pending" || status === "processing") {
      conditions.push(eq(schemas.omrProcessingOutbox.status, status));
    }

    const whereClause = and(...conditions);

    // Query outbox with LEFT JOIN to results
    const [rows, countResult] = await Promise.all([
      this.db
        .select({
          // Outbox fields
          id: schemas.omrProcessingOutbox.id,
          ballotId: schemas.omrProcessingOutbox.ballotId,
          s3Key: schemas.omrProcessingOutbox.s3Key,
          status: schemas.omrProcessingOutbox.status,
          processedAt: schemas.omrProcessingOutbox.processedAt,
          createdAt: schemas.omrProcessingOutbox.createdAt,
          // Result fields (nullable)
          resultValidationStatus: schemas.ballotScanResults.validationStatus,
          resultQrVerified: schemas.ballotScanResults.qrVerified,
          resultSelections: schemas.ballotScanResults.selections
        })
        .from(schemas.omrProcessingOutbox)
        .leftJoin(
          schemas.ballotScanResults,
          eq(schemas.ballotScanResults.requestId, schemas.omrProcessingOutbox.id)
        )
        .where(whereClause)
        .orderBy(desc(schemas.omrProcessingOutbox.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schemas.omrProcessingOutbox)
        .where(whereClause)
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    // Generate S3 URLs on-demand for each row
    const items = await Promise.all(
      rows.map(async (row) => {
        const s3Url = await this.s3Service.getPresignedDownloadUrl(row.s3Key, S3_URL_EXPIRY);

        return {
          requestId: row.id,
          ballotId: row.ballotId,
          status: row.status,
          validationStatus: row.resultValidationStatus || null,
          qrVerified: row.resultQrVerified ?? null,
          s3Url,
          selections: row.resultSelections || null,
          processedAt: row.processedAt || null,
          createdAt: row.createdAt
        };
      })
    );

    return {
      items,
      pageIndex,
      pageSize,
      total: totalCount
    };
  }
}
