import { Injectable } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { BallotScanResult } from "@signa/api/modules/ballot/domain/entities";
import type { BallotScanResultRepository } from "@signa/api/modules/ballot/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleBallotScanResultRepository implements BallotScanResultRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async save(result: BallotScanResult): Promise<void> {
    await this.db
      .insert(schemas.ballotScanResults)
      .values({
        id: result.id,
        requestId: result.requestId,
        ballotId: result.ballotId,
        userId: result.userId,
        s3Key: result.s3Key,
        selections: result.selections,
        qrVerified: result.qrVerified,
        processingMetadata: result.processingMetadata,
        validationStatus: result.validationStatus,
        validationErrors: result.validationErrors,
        processedAt: result.processedAt.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString()
      })
      .onConflictDoUpdate({
        target: schemas.ballotScanResults.requestId,
        set: {
          s3Key: result.s3Key,
          selections: result.selections,
          qrVerified: result.qrVerified,
          processingMetadata: result.processingMetadata,
          validationStatus: result.validationStatus,
          validationErrors: result.validationErrors,
          processedAt: result.processedAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }
      });
  }

  async findByRequestId(requestId: string): Promise<BallotScanResult | null> {
    const rows = await this.db
      .select()
      .from(schemas.ballotScanResults)
      .where(eq(schemas.ballotScanResults.requestId, requestId))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return BallotScanResult.rehydrate({
      id: row.id,
      requestId: row.requestId,
      ballotId: row.ballotId,
      userId: row.userId,
      s3Key: row.s3Key,
      selections: row.selections as any,
      qrVerified: row.qrVerified,
      processingMetadata: row.processingMetadata as any,
      validationStatus: row.validationStatus as any,
      validationErrors: (row.validationErrors as any) ?? undefined,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    });
  }

  async findByUserId(userId: string, limit: number, offset: number): Promise<BallotScanResult[]> {
    const rows = await this.db
      .select()
      .from(schemas.ballotScanResults)
      .where(eq(schemas.ballotScanResults.userId, userId))
      .orderBy(desc(schemas.ballotScanResults.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) =>
      BallotScanResult.rehydrate({
        id: row.id,
        requestId: row.requestId,
        ballotId: row.ballotId,
        userId: row.userId,
        s3Key: row.s3Key,
        selections: row.selections as any,
        qrVerified: row.qrVerified,
        processingMetadata: row.processingMetadata as any,
        validationStatus: row.validationStatus as any,
        validationErrors: (row.validationErrors as any) ?? undefined,
        processedAt: row.processedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );
  }

  async deleteByRequestId(requestId: string): Promise<void> {
    await this.db
      .delete(schemas.ballotScanResults)
      .where(eq(schemas.ballotScanResults.requestId, requestId));
  }
}
