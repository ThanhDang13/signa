import { Query } from "@nestjs/cqrs";
import { type DashboardStats } from "@signa/shared";

export type GetDashboardStatsQueryPayload = Record<string, never>;

export type GetDashboardStatsQueryResult = DashboardStats;

export class GetDashboardStatsQuery extends Query<GetDashboardStatsQueryResult> {
  constructor(public readonly payload: GetDashboardStatsQueryPayload) {
    super();
  }
}
