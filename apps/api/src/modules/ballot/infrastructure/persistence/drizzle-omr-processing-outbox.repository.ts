import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { OmrProcessingRequest } from "@signa/api/modules/ballot/domain/entities";
import type { OmrProcessingOutboxRepository } from "@signa/api/modules/ballot/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleOmrProcessingOutboxRepository implements OmrProcessingOutboxRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async save(request: OmrProcessingRequest): Promise<void> {
    await this.db.insert(schemas.omrProcessingOutbox).values({
      id: request.id,
      ballotId: request.ballotId,
      s3Key: request.s3Key,
      status: request.status,
      attempts: request.attempts,
      lastError: request.lastError,
      processedAt: request.processedAt?.toISOString(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString()
    });
  }

  async findPending(limit: number): Promise<OmrProcessingRequest[]> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.status, "pending"))
      .limit(limit);

    return rows.map((row) =>
      OmrProcessingRequest.rehydrate({
        id: row.id,
        ballotId: row.ballotId,
        s3Key: row.s3Key,
        status: row.status as any,
        attempts: row.attempts,
        lastError: row.lastError ?? undefined,
        processedAt: row.processedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async update(request: OmrProcessingRequest): Promise<void> {
    await this.db
      .update(schemas.omrProcessingOutbox)
      .set({
        status: request.status,
        attempts: request.attempts,
        lastError: request.lastError,
        processedAt: request.processedAt?.toISOString(),
        updatedAt: request.updatedAt.toISOString()
      })
      .where(eq(schemas.omrProcessingOutbox.id, request.id));
  }
}
