import { Election } from "@signa/api/modules/election/domain/entities/election";

export const ELECTION_REPOSITORY = Symbol("ELECTION_REPOSITORY");

export interface ElectionRepository {
  findAll(): Promise<Election[]>;
  findById(id: string): Promise<Election | null>;
  findByStatus(status: string): Promise<Election[]>;
  findByCreator(createdById: string): Promise<Election[]>;
  save(election: Election): Promise<void>;
  delete(id: string): Promise<void>;
}
