import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, count, and, gte, sql } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import { GetDashboardStatsQuery, type GetDashboardStatsQueryResult } from "../get-dashboard-stats.query";
import { ELECTION_STATUSES } from "@signa/shared";

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetDashboardStatsQuery): Promise<GetDashboardStatsQueryResult> {
    // Get election counts by status
    const electionStats = await this.db
      .select({
        status: schemas.elections.status,
        count: count()
      })
      .from(schemas.elections)
      .groupBy(schemas.elections.status);

    const electionCounts = {
      draft: 0,
      active: 0,
      closed: 0,
      total: 0
    };

    for (const stat of electionStats) {
      const statusCount = Number(stat.count);
      electionCounts.total += statusCount;

      if (stat.status === ELECTION_STATUSES.DRAFT) {
        electionCounts.draft = statusCount;
      } else if (stat.status === ELECTION_STATUSES.ACTIVE) {
        electionCounts.active = statusCount;
      } else if (stat.status === ELECTION_STATUSES.CLOSED) {
        electionCounts.closed = statusCount;
      }
    }

    // Get scan request statistics
    const scanStats = await this.db
      .select({
        status: schemas.omrProcessingOutbox.status,
        count: count()
      })
      .from(schemas.omrProcessingOutbox)
      .groupBy(schemas.omrProcessingOutbox.status);

    const scanCounts = {
      today: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    };

    for (const stat of scanStats) {
      const statusCount = Number(stat.count);
      scanCounts.total += statusCount;

      if (stat.status === "pending") {
        scanCounts.pending = statusCount;
      } else if (stat.status === "processing") {
        scanCounts.processing = statusCount;
      } else if (stat.status === "completed") {
        scanCounts.completed = statusCount;
      } else if (stat.status === "failed") {
        scanCounts.failed = statusCount;
      }
    }

    // Get today's scan count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayScans = await this.db
      .select({ count: count() })
      .from(schemas.omrProcessingOutbox)
      .where(gte(schemas.omrProcessingOutbox.createdAt, startOfToday.toISOString()));

    scanCounts.today = Number(todayScans[0]?.count ?? 0);

    // Get scan trend for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyScans = await this.db
      .select({
        date: sql<string>`DATE(${schemas.omrProcessingOutbox.createdAt})`,
        count: count()
      })
      .from(schemas.omrProcessingOutbox)
      .where(gte(schemas.omrProcessingOutbox.createdAt, sevenDaysAgo.toISOString()))
      .groupBy(sql`DATE(${schemas.omrProcessingOutbox.createdAt})`)
      .orderBy(sql`DATE(${schemas.omrProcessingOutbox.createdAt})`);

    // Fill in missing days with zero counts
    const scanTrend: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existing = dailyScans.find(s => s.date === dateStr);
      scanTrend.push({
        date: dateStr,
        count: existing ? Number(existing.count) : 0
      });
    }

    // Get ballot statistics
    const ballotStats = await this.db
      .select({ count: count() })
      .from(schemas.ballots);

    const votedBallots = await this.db
      .select({ count: count() })
      .from(schemas.ballots)
      .where(eq(schemas.ballots.status, "voted"));

    const ballotCounts = {
      total: Number(ballotStats[0]?.count ?? 0),
      voted: Number(votedBallots[0]?.count ?? 0)
    };

    // Get recent activity (last 10 items)
    const recentScans = await this.db
      .select({
        id: schemas.omrProcessingOutbox.id,
        status: schemas.omrProcessingOutbox.status,
        createdAt: schemas.omrProcessingOutbox.createdAt,
        electionId: schemas.omrProcessingOutbox.electionId,
        electionTitle: schemas.elections.title
      })
      .from(schemas.omrProcessingOutbox)
      .leftJoin(schemas.elections, eq(schemas.omrProcessingOutbox.electionId, schemas.elections.id))
      .orderBy(sql`${schemas.omrProcessingOutbox.createdAt} DESC`)
      .limit(5);

    const recentGenerations = await this.db
      .select({
        id: schemas.ballotGenerationOutbox.id,
        status: schemas.ballotGenerationOutbox.status,
        createdAt: schemas.ballotGenerationOutbox.createdAt,
        electionId: schemas.ballotGenerationOutbox.electionId,
        electionTitle: schemas.elections.title
      })
      .from(schemas.ballotGenerationOutbox)
      .leftJoin(schemas.elections, eq(schemas.ballotGenerationOutbox.electionId, schemas.elections.id))
      .orderBy(sql`${schemas.ballotGenerationOutbox.createdAt} DESC`)
      .limit(5);

    // Combine and sort activities
    const activities = [
      ...recentScans.map((scan) => ({
        id: scan.id,
        type: "scan" as const,
        description: `Ballot scan ${scan.status}`,
        status: scan.status,
        timestamp: scan.createdAt,
        electionId: scan.electionId,
        electionTitle: scan.electionTitle ?? undefined
      })),
      ...recentGenerations.map((gen) => ({
        id: gen.id,
        type: "generation" as const,
        description: `Ballot generation ${gen.status}`,
        status: gen.status,
        timestamp: gen.createdAt,
        electionId: gen.electionId,
        electionTitle: gen.electionTitle ?? undefined
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      elections: electionCounts,
      scans: scanCounts,
      ballots: ballotCounts,
      scanTrend,
      recentActivity: activities
    };
  }
}
