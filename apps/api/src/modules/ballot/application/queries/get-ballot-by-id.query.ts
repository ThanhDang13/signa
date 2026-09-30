import { Query } from "@nestjs/cqrs";
import { z } from "zod";
import { ballotReadModelSchema } from "@signa/shared";

export type GetBallotByIdQueryPayload = {
  id: string;
};

export type GetBallotByIdQueryResult = z.infer<typeof ballotReadModelSchema>;

export class GetBallotByIdQuery extends Query<GetBallotByIdQueryResult> {
  constructor(public readonly payload: GetBallotByIdQueryPayload) {
    super();
  }
}
