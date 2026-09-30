import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, asc, desc, sql, and } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  ListElectionsQuery,
  type ListElectionsQueryResult,
  type ElectionReadModel
} from "../list-elections.query";

@QueryHandler(ListElectionsQuery)
export class ListElectionsHandler implements IQueryHandler<ListElectionsQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: ListElectionsQuery): Promise<ListElectionsQueryResult> {
    const { pageIndex, pageSize, sortBy, order, status, createdById } = query.payload;

    const sortColumnMap = {
      title: schemas.elections.title,
      status: schemas.elections.status,
      startDate: schemas.elections.startDate,
      createdAt: schemas.elections.createdAt
    };

    const sortColumn = sortColumnMap[sortBy];
    const orderFn = order === "desc" ? desc : asc;
    const offset = pageIndex * pageSize;

    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(schemas.elections.status, status as any));
    }
    if (createdById) {
      conditions.push(eq(schemas.elections.createdById, createdById));
    }

    let query_builder = this.db.select().from(schemas.elections);
    let countQuery = this.db.select({ count: sql<number>`count(*)::int` }).from(schemas.elections);

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

    const data: ElectionReadModel[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      formStructure: row.formStructure,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      maxVoters: row.maxVoters ?? undefined,
      createdById: row.createdById,
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
