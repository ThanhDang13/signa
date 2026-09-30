import { defineContract } from "@signa/dsl-http-contract";
import {
  getScanRequestParamsSchema,
  getScanRequestResponseSchema
} from "../schemas/get-scan-request.schema";

export const getScanRequestContract = defineContract({
  path: "/v1/ballots/scan-requests/:requestId",
  method: "GET",
  params: getScanRequestParamsSchema,
  response: getScanRequestResponseSchema
});
