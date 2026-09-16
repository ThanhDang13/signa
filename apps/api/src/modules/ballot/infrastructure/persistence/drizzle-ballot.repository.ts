import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { Ballot } from "@signa/api/modules/ballot/domain/entities";
import { BallotRepository } from "@signa/api/modules/ballot/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleBallotRepository implements BallotRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async findAll(): Promise<Ballot[]> {
    const rows = await this.db.select().from(schemas.ballots);
    return rows.map((row) =>
      Ballot.rehydrate({
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
      })
    );
  }

  async findById(id: string): Promise<Ballot | null> {
    const row = await this.db.query.ballots.findFirst({
      where: eq(schemas.ballots.id, id)
    });

    if (!row) return null;

    return Ballot.rehydrate({
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
    });
  }

  async findByElectionId(electionId: string): Promise<Ballot[]> {
    const rows = await this.db.query.ballots.findMany({
      where: eq(schemas.ballots.electionId, electionId)
    });

    return rows.map((row) =>
      Ballot.rehydrate({
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
      })
    );
  }

  async findByStatus(status: string): Promise<Ballot[]> {
    const rows = await this.db.query.ballots.findMany({
      where: eq(schemas.ballots.status, status as any)
    });

    return rows.map((row) =>
      Ballot.rehydrate({
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
      })
    );
  }

  async save(ballot: Ballot): Promise<void> {
    const ballotId = ballot.id.toString();

    await this.db
      .insert(schemas.ballots)
      .values({
        id: ballotId,
        electionId: ballot.electionId,
        signature: ballot.signature,
        status: ballot.status,
        pdfS3Key: ballot.pdfS3Key ?? null,
        qrCodeData: ballot.qrCodeData,
        layoutMetadata: ballot.layoutMetadata,
        generatedAt: ballot.generatedAt.toISOString(),
        createdAt: ballot.createdAt.toISOString(),
        updatedAt: ballot.updatedAt.toISOString()
      })
      .onConflictDoUpdate({
        target: schemas.ballots.id,
        set: {
          status: ballot.status,
          pdfS3Key: ballot.pdfS3Key ?? null,
          updatedAt: ballot.updatedAt.toISOString()
        }
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schemas.ballots).where(eq(schemas.ballots.id, id));
  }
}
