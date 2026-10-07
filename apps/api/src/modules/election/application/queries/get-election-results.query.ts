import { Query } from "@nestjs/cqrs";

export type GetElectionResultsQueryPayload = {
  id: string;
};

export type FieldResultOption = {
  option: string;
  count: number;
  percentage: number;
};

export type FieldResult = {
  fieldId: string;
  label: string;
  type: "checkbox" | "radio" | "text";
  totalVotes: number;
  results: FieldResultOption[];
};

export type ElectionStatistics = {
  totalBallots: number;
  scannedBallots: number;
  validScans: number;
  invalidScans: number;
  pendingBallots: number;
};

export type GetElectionResultsQueryResult = {
  statistics: ElectionStatistics;
  fields: FieldResult[];
};

export class GetElectionResultsQuery extends Query<GetElectionResultsQueryResult> {
  constructor(public readonly payload: GetElectionResultsQueryPayload) {
    super();
  }
}
