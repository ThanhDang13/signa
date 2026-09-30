import { defineContract } from "@signa/dsl-http-contract";
import {
  listScanRequestsQuerySchema,
  listScanRequestsResponseSchema
} from "../schemas/list-scan-requests.schema";

export const listScanRequestsContract = defineContract({
  path: "/v1/ballots/scan-requests",
  method: "GET",
  query: listScanRequestsQuerySchema,
  response: listScanRequestsResponseSchema
});
