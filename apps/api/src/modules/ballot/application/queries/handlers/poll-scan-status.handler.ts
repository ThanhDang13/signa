import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { and, eq, gt } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { PollScanStatusQuery } from "@signa/api/modules/ballot/application/queries";

@QueryHandler(PollScanStatusQuery)
export class PollScanStatusHandler implements IQueryHandler<PollScanStatusQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: PollScanStatusQuery) {
    const { userId, since } = query.payload;

    const conditions = [eq(schemas.omrProcessingOutbox.userId, userId)];

    // Only fetch items updated after 'since' timestamp
    if (since) {
      conditions.push(gt(schemas.omrProcessingOutbox.updatedAt, since));
    }

    const rows = await this.db
      .select({
        id: schemas.omrProcessingOutbox.id,
        status: schemas.omrProcessingOutbox.status,
        updatedAt: schemas.omrProcessingOutbox.updatedAt
      })
      .from(schemas.omrProcessingOutbox)
      .where(and(...conditions));

    return {
      items: rows.map((row) => ({
        requestId: row.id,
        status: row.status,
        updatedAt: row.updatedAt
      })),
      serverTime: new Date().toISOString()
    };
  }
}
