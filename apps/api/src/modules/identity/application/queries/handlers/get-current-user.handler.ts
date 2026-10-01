import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetCurrentUserQuery, type GetCurrentUserQueryResult } from "../get-current-user.query";
import { createUserNotFoundError } from "@signa/api/modules/identity/application/errors";

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetCurrentUserQuery): Promise<GetCurrentUserQueryResult> {
    const row = await this.db.query.users.findFirst({
      where: eq(schemas.users.id, query.payload.userId),
      columns: {
        id: true,
        email: true,
        fullname: true,
        avatar: true,
        bio: true,
        role: true
      }
    });

    if (!row) {
      throw createUserNotFoundError();
    }

    return {
      id: row.id,
      email: row.email,
      fullname: row.fullname,
      avatar: row.avatar ?? undefined,
      bio: row.bio ?? undefined,
      role: row.role
    };
  }
}
