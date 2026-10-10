import { Injectable } from "@nestjs/common";
import { eq, desc, count } from "drizzle-orm";
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
      electionId: request.electionId,
      userId: request.userId,
      s3Key: request.s3Key,
      status: request.status,
      attempts: request.attempts,
      dispatchId: request.dispatchId,
      lastError: request.lastError,
      processedAt: request.processedAt?.toISOString(),
      processingStartedAt: request.processingStartedAt?.toISOString(),
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
        electionId: row.electionId,
        userId: row.userId,
        s3Key: row.s3Key,
        status: row.status as any,
        attempts: row.attempts,
        dispatchId: row.dispatchId ?? undefined,
        lastError: row.lastError ?? undefined,
        processedAt: row.processedAt ?? undefined,
        processingStartedAt: row.processingStartedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async findProcessing(limit: number): Promise<OmrProcessingRequest[]> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.status, "processing"))
      .limit(limit);

    return rows.map((row) =>
      OmrProcessingRequest.rehydrate({
        id: row.id,
        ballotId: row.ballotId,
        electionId: row.electionId,
        userId: row.userId,
        s3Key: row.s3Key,
        status: row.status as any,
        attempts: row.attempts,
        dispatchId: row.dispatchId ?? undefined,
        lastError: row.lastError ?? undefined,
        processedAt: row.processedAt ?? undefined,
        processingStartedAt: row.processingStartedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async update(request: OmrProcessingRequest): Promise<void> {
    await this.db
      .update(schemas.omrProcessingOutbox)
      .set({
        s3Key: request.s3Key,
        status: request.status,
        attempts: request.attempts,
        dispatchId: request.dispatchId,
        lastError: request.lastError,
        processedAt: request.processedAt?.toISOString(),
        processingStartedAt: request.processingStartedAt?.toISOString(),
        updatedAt: request.updatedAt.toISOString()
      })
      .where(eq(schemas.omrProcessingOutbox.id, request.id));
  }

  async findById(id: string): Promise<OmrProcessingRequest | null> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return OmrProcessingRequest.rehydrate({
      id: row.id,
      ballotId: row.ballotId,
      electionId: row.electionId,
      userId: row.userId,
      s3Key: row.s3Key,
      status: row.status as any,
      attempts: row.attempts,
      dispatchId: row.dispatchId ?? undefined,
      lastError: row.lastError ?? undefined,
      processedAt: row.processedAt ?? undefined,
      processingStartedAt: row.processingStartedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async findByBallotId(ballotId: string): Promise<OmrProcessingRequest | null> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.ballotId, ballotId))
      .orderBy(desc(schemas.omrProcessingOutbox.createdAt))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return OmrProcessingRequest.rehydrate({
      id: row.id,
      ballotId: row.ballotId,
      electionId: row.electionId,
      userId: row.userId,
      s3Key: row.s3Key,
      status: row.status as any,
      attempts: row.attempts,
      dispatchId: row.dispatchId ?? undefined,
      lastError: row.lastError ?? undefined,
      processedAt: row.processedAt ?? undefined,
      processingStartedAt: row.processingStartedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async findByS3Key(s3Key: string): Promise<OmrProcessingRequest | null> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.s3Key, s3Key))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return OmrProcessingRequest.rehydrate({
      id: row.id,
      ballotId: row.ballotId,
      electionId: row.electionId,
      userId: row.userId,
      s3Key: row.s3Key,
      status: row.status as any,
      attempts: row.attempts,
      dispatchId: row.dispatchId ?? undefined,
      lastError: row.lastError ?? undefined,
      processedAt: row.processedAt ?? undefined,
      processingStartedAt: row.processingStartedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async findByUserId(userId: string, limit: number, offset: number): Promise<OmrProcessingRequest[]> {
    const rows = await this.db
      .select()
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.userId, userId))
      .orderBy(desc(schemas.omrProcessingOutbox.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) =>
      OmrProcessingRequest.rehydrate({
        id: row.id,
        ballotId: row.ballotId,
        electionId: row.electionId,
        userId: row.userId,
        s3Key: row.s3Key,
        status: row.status as any,
        attempts: row.attempts,
        dispatchId: row.dispatchId ?? undefined,
        lastError: row.lastError ?? undefined,
        processedAt: row.processedAt ?? undefined,
        processingStartedAt: row.processingStartedAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(schemas.omrProcessingOutbox)
      .where(eq(schemas.omrProcessingOutbox.userId, userId));

    return result[0]?.count ?? 0;
  }
}
