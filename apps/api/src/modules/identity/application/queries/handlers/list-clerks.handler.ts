import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, asc, desc, sql } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { ROLES } from "@signa/shared";
import {
  ListClerksQuery,
  type ListClerksQueryResult,
  type ClerkReadModel
} from "../list-clerks.query";

@QueryHandler(ListClerksQuery)
export class ListClerksHandler implements IQueryHandler<ListClerksQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: ListClerksQuery): Promise<ListClerksQueryResult> {
    const { pageIndex, pageSize, sortBy, order } = query.payload;

    const sortColumnMap = {
      email: schemas.users.email,
      fullname: schemas.users.fullname,
      createdAt: schemas.users.createdAt
    };

    const sortColumn = sortColumnMap[sortBy];
    const orderFn = order === "desc" ? desc : asc;
    const offset = pageIndex * pageSize;

    const whereClause = eq(schemas.users.role, ROLES.CLERK);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(schemas.users)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schemas.users)
        .where(whereClause)
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const data: ClerkReadModel[] = rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullname: row.fullname,
      avatar: row.avatar ?? undefined,
      bio: row.bio ?? undefined,
      role: row.role,
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
