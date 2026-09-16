import { Ballot } from "@signa/api/modules/ballot/domain/entities/ballot";

export const BALLOT_REPOSITORY = Symbol("BALLOT_REPOSITORY");

export interface BallotRepository {
  findAll(): Promise<Ballot[]>;
  findById(id: string): Promise<Ballot | null>;
  findByElectionId(electionId: string): Promise<Ballot[]>;
  findByStatus(status: string): Promise<Ballot[]>;
  save(ballot: Ballot): Promise<void>;
  delete(id: string): Promise<void>;
}
