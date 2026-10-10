import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { BallotGenerationRequest } from "@signa/api/modules/ballot/domain/entities";
import type { BallotGenerationOutboxRepository } from "@signa/api/modules/ballot/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleBallotGenerationOutboxRepository implements BallotGenerationOutboxRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async save(request: BallotGenerationRequest): Promise<void> {
    await this.db.insert(schemas.ballotGenerationOutbox).values({
      id: request.id.toString(),
      electionId: request.electionId,
      ballotIds: JSON.stringify(request.ballotIds),
      timestamp: request.timestamp.toISOString(),
      status: request.status,
      attempts: request.attempts,
      lastError: request.lastError,
      processedAt: request.processedAt?.toISOString(),
      batchPdfS3Key: request.batchPdfS3Key,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString()
    });
  }

  async findPending(limit: number): Promise<BallotGenerationRequest[]> {
    const rows = await this.db
      .select()
      .from(schemas.ballotGenerationOutbox)
      .where(eq(schemas.ballotGenerationOutbox.status, "pending"))
      .limit(limit);

    return rows.map((row) =>
      BallotGenerationRequest.rehydrate({
        id: row.id,
        electionId: row.electionId,
        ballotIds: JSON.parse(row.ballotIds),
        timestamp: row.timestamp,
        status: row.status,
        attempts: row.attempts,
        lastError: row.lastError ?? undefined,
        processedAt: row.processedAt ?? undefined,
        batchPdfS3Key: row.batchPdfS3Key ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async update(request: BallotGenerationRequest): Promise<void> {
    await this.db
      .update(schemas.ballotGenerationOutbox)
      .set({
        status: request.status,
        attempts: request.attempts,
        lastError: request.lastError,
        processedAt: request.processedAt?.toISOString(),
        batchPdfS3Key: request.batchPdfS3Key,
        updatedAt: request.updatedAt.toISOString()
      })
      .where(eq(schemas.ballotGenerationOutbox.id, request.id.toString()));
  }
}
