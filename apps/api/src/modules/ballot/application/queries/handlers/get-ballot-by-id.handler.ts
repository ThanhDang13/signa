import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetBallotByIdQuery, type GetBallotByIdQueryResult } from "../get-ballot-by-id.query";
import { createBallotNotFoundError } from "@signa/api/modules/ballot/application/errors";

@QueryHandler(GetBallotByIdQuery)
export class GetBallotByIdHandler implements IQueryHandler<GetBallotByIdQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetBallotByIdQuery): Promise<GetBallotByIdQueryResult> {
    const row = await this.db.query.ballots.findFirst({
      where: eq(schemas.ballots.id, query.payload.id)
    });

    if (!row) {
      throw createBallotNotFoundError();
    }

    return {
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
    };
  }
}
