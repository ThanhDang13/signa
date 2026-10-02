import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { and, eq, inArray } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { PollScanStatusQuery } from "@signa/api/modules/ballot/application/queries";

@QueryHandler(PollScanStatusQuery)
export class PollScanStatusHandler implements IQueryHandler<PollScanStatusQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: PollScanStatusQuery) {
    const { userId } = query.payload;
    const t = schemas.omrProcessingOutbox;

    const rows = await this.db
      .select({ id: t.id, status: t.status })
      .from(t)
      .where(and(eq(t.userId, userId), inArray(t.status, ["pending", "processing"])));

    return { items: rows.map((r) => ({ requestId: r.id, status: r.status })) };
  }
}
