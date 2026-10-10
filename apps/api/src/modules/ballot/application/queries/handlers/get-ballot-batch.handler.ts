import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  GetBallotBatchQuery,
  type GetBallotBatchQueryResult
} from "../get-ballot-batch.query";
import { type BallotBatchReadModel } from "../list-ballot-batches.query";
import { createBallotBatchNotFoundError } from "@signa/api/modules/ballot/application/errors";

@QueryHandler(GetBallotBatchQuery)
export class GetBallotBatchHandler implements IQueryHandler<GetBallotBatchQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetBallotBatchQuery): Promise<GetBallotBatchQueryResult> {
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

    const data: BallotBatchReadModel = {
      id: row.id,
      electionId: row.electionId,
      count: JSON.parse(row.ballotIds).length,
      status: row.status,
      batchPdfS3Key: row.batchPdfS3Key ?? undefined,
      lastError: row.lastError ?? undefined,
      createdAt: row.createdAt,
      processedAt: row.processedAt ?? undefined
    };

    return data;
  }
}
