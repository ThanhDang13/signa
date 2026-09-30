import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, asc, desc, sql, and } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  ListBallotsQuery,
  type ListBallotsQueryResult,
  type BallotReadModel
} from "../list-ballots.query";

@QueryHandler(ListBallotsQuery)
export class ListBallotsHandler implements IQueryHandler<ListBallotsQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: ListBallotsQuery): Promise<ListBallotsQueryResult> {
    const { pageIndex, pageSize, sortBy, order, electionId, status } = query.payload;

    const sortColumnMap = {
      generatedAt: schemas.ballots.generatedAt,
      status: schemas.ballots.status,
      createdAt: schemas.ballots.createdAt
    };

    const sortColumn = sortColumnMap[sortBy];
    const orderFn = order === "desc" ? desc : asc;
    const offset = pageIndex * pageSize;

    // Build where conditions
    const conditions = [];
    if (electionId) {
      conditions.push(eq(schemas.ballots.electionId, electionId));
    }
    if (status) {
      conditions.push(eq(schemas.ballots.status, status));
    }

    let query_builder = this.db.select().from(schemas.ballots);
    let countQuery = this.db.select({ count: sql<number>`count(*)::int` }).from(schemas.ballots);

    if (conditions.length > 0) {
      const whereClause = and(...conditions);
      query_builder = query_builder.where(whereClause) as typeof query_builder;
      countQuery = countQuery.where(whereClause) as typeof countQuery;
    }

    const [rows, countResult] = await Promise.all([
      query_builder.orderBy(orderFn(sortColumn)).limit(pageSize).offset(offset),
      countQuery
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const data: BallotReadModel[] = rows.map((row) => ({
      id: row.id,
      electionId: row.electionId,
      signature: row.signature,
      status: row.status,
      pdfS3Key: row.pdfS3Key ?? undefined,
      qrCodeData: row.qrCodeData,
      layoutMetadata: row.layoutMetadata,
      generatedAt: row.generatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
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
