import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, asc, desc, sql } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  ListBallotBatchesQuery,
  type ListBallotBatchesQueryResult,
  type BallotBatchReadModel
} from "../list-ballot-batches.query";

@QueryHandler(ListBallotBatchesQuery)
export class ListBallotBatchesHandler implements IQueryHandler<ListBallotBatchesQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: ListBallotBatchesQuery): Promise<ListBallotBatchesQueryResult> {
    const { electionId, pageIndex, pageSize, sortBy, order } = query.payload;

    const sortColumnMap = {
      createdAt: schemas.ballotGenerationOutbox.createdAt,
      status: schemas.ballotGenerationOutbox.status
    };

    const sortColumn = sortColumnMap[sortBy];
    const orderFn = order === "desc" ? desc : asc;
    const offset = pageIndex * pageSize;

    const whereClause = eq(schemas.ballotGenerationOutbox.electionId, electionId);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(schemas.ballotGenerationOutbox)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schemas.ballotGenerationOutbox)
        .where(whereClause)
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const data: BallotBatchReadModel[] = rows.map((row) => ({
      id: row.id,
      electionId: row.electionId,
      count: JSON.parse(row.ballotIds).length, // Parse ballotIds array to get count
      status: row.status,
      batchPdfS3Key: row.batchPdfS3Key ?? undefined,
      lastError: row.lastError ?? undefined,
      createdAt: row.createdAt,
      processedAt: row.processedAt ?? undefined
    }));

    return {
      data,
      meta: {
        pageIndex,
        pageSize,
        totalCount,
        totalPages
      }
    };
  }
}
