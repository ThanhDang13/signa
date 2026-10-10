import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { ballotBatchReadModelSchema } from "@signa/shared";
import type { BallotBatchReadModel } from "./list-ballot-batches.query";

export type GetBallotBatchQueryPayload = {
  batchId: string;
};

export type GetBallotBatchQueryResult = BallotBatchReadModel;

export class GetBallotBatchQuery extends Query<GetBallotBatchQueryResult> {
  constructor(public readonly payload: GetBallotBatchQueryPayload) {
    super();
  }
}
