import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { electionReadModelSchema } from "@signa/shared";

export type GetElectionByIdQueryPayload = {
  id: string;
};

export type GetElectionByIdQueryResult = z.infer<typeof electionReadModelSchema>;

export class GetElectionByIdQuery extends Query<GetElectionByIdQueryResult> {
  constructor(public readonly payload: GetElectionByIdQueryPayload) {
    super();
  }
}
