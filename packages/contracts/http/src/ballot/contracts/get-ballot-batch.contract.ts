import { defineContract } from "@signa/dsl-http-contract";
import {
  getBallotBatchParamsSchema,
  getBallotBatchResponseSchema
} from "../schemas/get-ballot-batch.schema";

export const getBallotBatchContract = defineContract({
  method: "GET",
  path: "/v1/ballot-batches/:batchId",
  params: getBallotBatchParamsSchema,
  response: getBallotBatchResponseSchema
});
