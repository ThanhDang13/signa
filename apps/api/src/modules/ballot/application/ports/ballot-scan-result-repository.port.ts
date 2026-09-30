import { BallotScanResult } from "@signa/api/modules/ballot/domain/entities";

export const BALLOT_SCAN_RESULT_REPOSITORY = Symbol("BALLOT_SCAN_RESULT_REPOSITORY");

export interface BallotScanResultRepository {
  save(result: BallotScanResult): Promise<void>;
  findByRequestId(requestId: string): Promise<BallotScanResult | null>;
  findByUserId(userId: string, limit: number, offset: number): Promise<BallotScanResult[]>;
  deleteByRequestId(requestId: string): Promise<void>;
}
