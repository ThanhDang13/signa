import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { InjectDatabase } from "@signa/nest-drizzle";
import type { DrizzleDatabase } from "@signa/api/core/database/database.config";
import { eq, and, sql } from "drizzle-orm";
import * as schemas from "@signa/runtime-drizzle/schemas";
import {
  GetElectionResultsQuery,
  type GetElectionResultsQueryResult,
  type FieldResult,
  type FieldResultOption
} from "../get-election-results.query";
import { createElectionNotFoundError } from "@signa/api/modules/election/application/errors";
import type { FormField } from "@signa/shared";

@QueryHandler(GetElectionResultsQuery)
export class GetElectionResultsHandler implements IQueryHandler<GetElectionResultsQuery> {
  constructor(@InjectDatabase() private readonly db: DrizzleDatabase) {}

  async execute(query: GetElectionResultsQuery): Promise<GetElectionResultsQueryResult> {
    const electionId = query.payload.id;

    // 1. Get election with form structure
    const election = await this.db.query.elections.findFirst({
      where: eq(schemas.elections.id, electionId)
    });

    if (!election) {
      throw createElectionNotFoundError();
    }

    const formFields = election.formStructure.fields as FormField[];

    // 2. Get ballot statistics
    const ballotStats = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        voted: sql<number>`count(*) filter (where ${schemas.ballots.status} = 'voted')::int`,
        pending: sql<number>`count(*) filter (where ${schemas.ballots.status} = 'pending')::int`
      })
      .from(schemas.ballots)
      .where(eq(schemas.ballots.electionId, electionId));

    const totalBallots = ballotStats[0]?.total ?? 0;
    const scannedBallots = ballotStats[0]?.voted ?? 0;
    const pendingBallots = ballotStats[0]?.pending ?? 0;

    // 3. Get scan result statistics
    const scanStats = await this.db
      .select({
        valid: sql<number>`count(*) filter (where ${schemas.ballotScanResults.validationStatus} = 'valid')::int`,
        invalid: sql<number>`count(*) filter (where ${schemas.ballotScanResults.validationStatus} != 'valid')::int`
      })
      .from(schemas.ballotScanResults)
      .innerJoin(schemas.ballots, eq(schemas.ballotScanResults.ballotId, schemas.ballots.id))
      .where(eq(schemas.ballots.electionId, electionId));

    const validScans = scanStats[0]?.valid ?? 0;
    const invalidScans = scanStats[0]?.invalid ?? 0;

    // 4. Get vote counts per field and option (only valid scans)
    // We need to unnest the selections JSON array and aggregate
    const voteCountsRaw = await this.db.execute<{
      field_id: string;
      selected_value: string;
      count: string;
    }>(sql`
      SELECT
        (jsonb_array_elements(selections)->>'fieldId') as field_id,
        jsonb_array_elements(jsonb_array_elements(selections)->'selectedValues')#>>'{}'  as selected_value,
        COUNT(*)::text as count
      FROM ballot_scan_results bsr
      INNER JOIN ballots b ON bsr.ballot_id = b.id
      WHERE b.election_id = ${electionId}
        AND bsr.validation_status = 'valid'
      GROUP BY field_id, selected_value
    `);

    // 5. Build field results
    const fieldResultsMap = new Map<string, Map<string, number>>();

    for (const row of voteCountsRaw.rows) {
      const fieldId = row.field_id;
      const selectedValue = row.selected_value;
      const count = parseInt(row.count, 10);

      if (!fieldResultsMap.has(fieldId)) {
        fieldResultsMap.set(fieldId, new Map());
      }

      fieldResultsMap.get(fieldId)!.set(selectedValue, count);
    }

    // 6. Map to response format
    const fields: FieldResult[] = formFields.map((field) => {
      const voteCounts = fieldResultsMap.get(field.id) ?? new Map();
      const totalVotes = Array.from(voteCounts.values()).reduce((sum, count) => sum + count, 0);

      const results: FieldResultOption[] = (field.options ?? []).map((option) => {
        const count = voteCounts.get(option) ?? 0;
        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

        return {
          option,
          count,
          percentage
        };
      });

      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        totalVotes,
        results
      };
    });

    return {
      statistics: {
        totalBallots,
        scannedBallots,
        validScans,
        invalidScans,
        pendingBallots
      },
      fields
    };
  }
}
