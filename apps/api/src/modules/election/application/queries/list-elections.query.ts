import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { electionReadModelSchema } from "@signa/shared";
import type { PaginationMetadata } from "@signa/shared";

export type ListElectionsQueryPayload = {
  pageIndex: number;
  pageSize: number;
  sortBy: "title" | "status" | "startDate" | "createdAt";
  order: "asc" | "desc";
  status?: string;
  createdById?: string;
};

export type ElectionReadModel = z.infer<typeof electionReadModelSchema>;

export type ListElectionsQueryResult = {
  data: ElectionReadModel[];
  meta: PaginationMetadata;
};

export class ListElectionsQuery extends Query<ListElectionsQueryResult> {
  constructor(public readonly payload: ListElectionsQueryPayload) {
    super();
  }
}
