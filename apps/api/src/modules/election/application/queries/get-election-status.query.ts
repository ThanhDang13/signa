import { Query } from "@nestjs/cqrs";

export type GetElectionStatusQueryPayload = {
  electionId: string;
};

export type GetElectionStatusQueryResult = {
  id: string;
  status: string;
  isActive: boolean;
};

export class GetElectionStatusQuery extends Query<GetElectionStatusQueryResult> {
  constructor(public readonly payload: GetElectionStatusQueryPayload) {
    super();
  }
}
