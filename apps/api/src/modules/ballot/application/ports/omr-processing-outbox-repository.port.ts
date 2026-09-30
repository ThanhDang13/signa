import { OmrProcessingRequest } from "@signa/api/modules/ballot/domain/entities";

export const OMR_PROCESSING_OUTBOX_REPOSITORY = Symbol("OMR_PROCESSING_OUTBOX_REPOSITORY");

export interface OmrProcessingOutboxRepository {
  save(request: OmrProcessingRequest): Promise<void>;
  findPending(limit: number): Promise<OmrProcessingRequest[]>;
  findProcessing(limit: number): Promise<OmrProcessingRequest[]>;
  update(request: OmrProcessingRequest): Promise<void>;
  findById(id: string): Promise<OmrProcessingRequest | null>;
  findByBallotId(ballotId: string): Promise<OmrProcessingRequest | null>;
  findByS3Key(s3Key: string): Promise<OmrProcessingRequest | null>;
  findByUserId(userId: string, limit: number, offset: number): Promise<OmrProcessingRequest[]>;
  countByUserId(userId: string): Promise<number>;
}
