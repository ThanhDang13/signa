import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetElectionByIdQuery, type GetElectionByIdQueryResult } from "../get-election-by-id.query";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@QueryHandler(GetElectionByIdQuery)
export class GetElectionByIdHandler implements IQueryHandler<GetElectionByIdQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetElectionByIdQuery): Promise<GetElectionByIdQueryResult> {
    const row = await this.db.query.elections.findFirst({
      where: eq(schemas.elections.id, query.payload.id)
    });

    if (!row) {
      throw createElectionNotFoundError();
    }

    return {
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
    };
  }
}
