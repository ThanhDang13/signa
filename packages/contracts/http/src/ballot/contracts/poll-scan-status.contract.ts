import { defineContract } from "@signa/dsl-http-contract";
import { pollScanStatusResponseSchema } from "../schemas/poll-scan-status.schema";

export const pollScanStatusContract = defineContract({
  path: "/v1/ballots/scan-requests/poll",
  method: "GET",
  response: pollScanStatusResponseSchema
});
