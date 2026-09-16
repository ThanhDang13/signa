import { OmrProcessingRequest } from "@signa/api/modules/ballot/domain/entities";

export const OMR_PROCESSING_OUTBOX_REPOSITORY = Symbol("OMR_PROCESSING_OUTBOX_REPOSITORY");

export interface OmrProcessingOutboxRepository {
  save(request: OmrProcessingRequest): Promise<void>;
  findPending(limit: number): Promise<OmrProcessingRequest[]>;
  update(request: OmrProcessingRequest): Promise<void>;
}
