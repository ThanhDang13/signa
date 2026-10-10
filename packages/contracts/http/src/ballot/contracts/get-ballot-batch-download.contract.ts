import { defineContract } from "@signa/dsl-http-contract";
import {
  getBallotBatchDownloadParamsSchema,
  getBallotBatchDownloadResponseSchema
} from "../schemas/get-ballot-batch-download.schema";

export const getBallotBatchDownloadContract = defineContract({
  method: "GET",
  path: "/v1/ballot-batches/:batchId/download",
  params: getBallotBatchDownloadParamsSchema,
  response: getBallotBatchDownloadResponseSchema
});
