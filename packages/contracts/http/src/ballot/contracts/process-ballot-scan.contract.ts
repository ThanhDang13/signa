import { defineContract } from "@signa/dsl-http-contract";
import {
  processBallotScanParamsSchema,
  processBallotScanSchema,
  processBallotScanResponseSchema
} from "../schemas/process-ballot-scan.schema";

export const processBallotScanContract = defineContract({
  method: "POST",
  path: "/v1/ballots/:ballotId/process-scan",
  params: processBallotScanParamsSchema,
  body: processBallotScanSchema,
  response: processBallotScanResponseSchema
});
