import { defineContract } from "@signa/dsl-http-contract";
import {
  pollScanStatusQuerySchema,
  pollScanStatusResponseSchema
} from "../schemas/poll-scan-status.schema";

export const pollScanStatusContract = defineContract({
  path: "/v1/ballots/scan-requests/poll",
  method: "GET",
  query: pollScanStatusQuerySchema,
  response: pollScanStatusResponseSchema
});
