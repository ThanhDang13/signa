import { z } from "zod";

export const getElectionResultsParamsSchema = z.object({
  id: z.string().uuid()
});

export const getElectionResultsResponseSchema = z.object({
  statistics: z.object({
    totalBallots: z.number().int().describe("Total ballots generated"),
    scannedBallots: z.number().int().describe("Ballots with status 'voted'"),
    validScans: z.number().int().describe("Scan results with 'valid' status"),
    invalidScans: z.number().int().describe("Scan results with invalid statuses"),
    pendingBallots: z.number().int().describe("Ballots not yet scanned")
  }),
  fields: z.array(
    z.object({
      fieldId: z.string(),
      label: z.string(),
      type: z.enum(["checkbox", "radio", "text"]),
      totalVotes: z.number().int().describe("Total votes for this field"),
      results: z.array(
        z.object({
          option: z.string(),
          count: z.number().int(),
          percentage: z.number().describe("Percentage of total votes for this field")
        })
      )
    })
  )
});
