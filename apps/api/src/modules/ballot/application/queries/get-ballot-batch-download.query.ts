import { Query } from "@nestjs/cqrs";

export type GetBallotBatchDownloadQueryPayload = {
  batchId: string;
};

export type GetBallotBatchDownloadQueryResult = {
  downloadUrl: string;
  expiresIn: number;
};

export class GetBallotBatchDownloadQuery extends Query<GetBallotBatchDownloadQueryResult> {
  constructor(public readonly payload: GetBallotBatchDownloadQueryPayload) {
    super();
  }
}
