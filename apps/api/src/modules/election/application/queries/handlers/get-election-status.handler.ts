import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  GetElectionStatusQuery,
  type GetElectionStatusQueryResult
} from "../get-election-status.query";
import {
  ELECTION_REPOSITORY,
  type ElectionRepository
} from "@signa/api/modules/election/application/ports";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";

@QueryHandler(GetElectionStatusQuery)
export class GetElectionStatusHandler implements IQueryHandler<GetElectionStatusQuery> {
  constructor(
    @Inject(ELECTION_REPOSITORY) private readonly elections: ElectionRepository
  ) {}

  async execute(query: GetElectionStatusQuery): Promise<GetElectionStatusQueryResult> {
    const election = await this.elections.findById(query.payload.electionId);

    if (!election) {
      throw createElectionNotFoundError();
    }

    return {
      id: election.id.toString(),
      status: election.status,
      isActive: election.isActive()
    };
  }
}
