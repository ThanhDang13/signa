import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "@signa/nest-drizzle";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { Election } from "@signa/api/modules/election/domain/entities";
import { ElectionRepository } from "@signa/api/modules/election/application/ports";
import { type DrizzleDatabase } from "@signa/api/core/database/database.config";

@Injectable()
export class DrizzleElectionRepository implements ElectionRepository {
  constructor(
    @InjectDatabase()
    private readonly db: DrizzleDatabase
  ) {}

  async findAll(): Promise<Election[]> {
    const rows = await this.db.select().from(schemas.elections);
    return rows.map((row) =>
      Election.rehydrate({
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
      })
    );
  }

  async findById(id: string): Promise<Election | null> {
    const row = await this.db.query.elections.findFirst({
      where: eq(schemas.elections.id, id)
    });

    if (!row) return null;

    return Election.rehydrate({
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
    });
  }

  async findByStatus(status: string): Promise<Election[]> {
    const rows = await this.db.query.elections.findMany({
      where: eq(schemas.elections.status, status as any)
    });

    return rows.map((row) =>
      Election.rehydrate({
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
      })
    );
  }

  async findByCreator(createdById: string): Promise<Election[]> {
    const rows = await this.db.query.elections.findMany({
      where: eq(schemas.elections.createdById, createdById)
    });

    return rows.map((row) =>
      Election.rehydrate({
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
      })
    );
  }

  async save(election: Election): Promise<void> {
    const electionId = election.id.toString();

    await this.db
      .insert(schemas.elections)
      .values({
        id: electionId,
        title: election.title,
        description: election.description ?? null,
        formStructure: election.formStructure,
        status: election.status,
        startDate: election.startDate?.toISOString() ?? "",
        endDate: election.endDate?.toISOString() ?? "",
        maxVoters: election.maxVoters ?? null,
        createdById: election.createdById,
        createdAt: election.createdAt.toISOString(),
        updatedAt: election.updatedAt.toISOString()
      })
      .onConflictDoUpdate({
        target: schemas.elections.id,
        set: {
          title: election.title,
          description: election.description ?? null,
          formStructure: election.formStructure,
          status: election.status,
          startDate: election.startDate?.toISOString() ?? "",
          endDate: election.endDate?.toISOString() ?? "",
          maxVoters: election.maxVoters ?? null,
          updatedAt: election.updatedAt.toISOString()
        }
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schemas.elections).where(eq(schemas.elections.id, id));
  }
}
