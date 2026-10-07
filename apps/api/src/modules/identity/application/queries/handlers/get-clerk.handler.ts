import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetClerkQuery, type GetClerkQueryResult } from "../get-clerk.query";
import { createClerkNotFoundError } from "@signa/api/modules/identity/application/errors";

@QueryHandler(GetClerkQuery)
export class GetClerkHandler implements IQueryHandler<GetClerkQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetClerkQuery): Promise<GetClerkQueryResult> {
    const row = await this.db.query.users.findFirst({
      where: eq(schemas.users.id, query.payload.id),
      columns: {
        id: true,
        email: true,
        fullname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!row) {
      throw createClerkNotFoundError();
    }

    return {
      id: row.id,
      email: row.email,
      fullname: row.fullname,
      avatar: row.avatar ?? undefined,
      bio: row.bio ?? undefined,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
