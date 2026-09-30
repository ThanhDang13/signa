import { defineContract } from "@signa/dsl-http-contract";
import {
  retryScanParamsSchema,
  retryScanBodySchema,
  retryScanResponseSchema
} from "../schemas/retry-scan.schema";

export const retryScanContract = defineContract({
  path: "/v1/ballots/scan-requests/:requestId/retry",
  method: "POST",
  params: retryScanParamsSchema,
  body: retryScanBodySchema,
  response: retryScanResponseSchema
});
