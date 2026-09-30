import { IQuery } from "@nestjs/cqrs";

export type ListScanRequestsQueryPayload = {
  userId: string;
  pageIndex: number;
  pageSize: number;
  status?: "pending" | "processing" | "completed" | "failed";
};

export class ListScanRequestsQuery implements IQuery {
  constructor(public readonly payload: ListScanRequestsQueryPayload) {}
}
