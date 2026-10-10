import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { ballotBatchReadModelSchema } from "@signa/shared";
import type { PaginationMetadata } from "@signa/shared";

export type ListBallotBatchesQueryPayload = {
  electionId: string;
  pageIndex: number;
  pageSize: number;
  sortBy: "createdAt" | "status";
  order: "asc" | "desc";
};

export type BallotBatchReadModel = z.infer<typeof ballotBatchReadModelSchema>;

export type ListBallotBatchesQueryResult = {
  data: BallotBatchReadModel[];
  meta: PaginationMetadata;
};

export class ListBallotBatchesQuery extends Query<ListBallotBatchesQueryResult> {
  constructor(public readonly payload: ListBallotBatchesQueryPayload) {
    super();
  }
}
