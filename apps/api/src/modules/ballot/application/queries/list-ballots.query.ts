import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { ballotReadModelSchema } from "@signa/shared";
import type { BallotStatus, PaginationMetadata } from "@signa/shared";

export type ListBallotsQueryPayload = {
  pageIndex: number;
  pageSize: number;
  sortBy: "generatedAt" | "status" | "createdAt";
  order: "asc" | "desc";
  electionId?: string;
  status?: BallotStatus;
};

export type BallotReadModel = z.infer<typeof ballotReadModelSchema>;

export type ListBallotsQueryResult = {
  data: BallotReadModel[];
  meta: PaginationMetadata;
};

export class ListBallotsQuery extends Query<ListBallotsQueryResult> {
  constructor(public readonly payload: ListBallotsQueryPayload) {
    super();
  }
}
