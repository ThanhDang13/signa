import { BallotGenerationRequest } from "@signa/api/modules/ballot/domain/entities";

export const BALLOT_GENERATION_OUTBOX_REPOSITORY = Symbol("BALLOT_GENERATION_OUTBOX_REPOSITORY");

export interface BallotGenerationOutboxRepository {
  save(request: BallotGenerationRequest): Promise<void>;
  findPending(limit: number): Promise<BallotGenerationRequest[]>;
  update(request: BallotGenerationRequest): Promise<void>;
}
