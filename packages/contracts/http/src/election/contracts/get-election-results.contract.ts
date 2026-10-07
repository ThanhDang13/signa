import { defineContract } from "@signa/dsl-http-contract";
import { getElectionResultsParamsSchema, getElectionResultsResponseSchema } from "../schemas/get-election-results.schema";

export const getElectionResultsContract = defineContract({
  method: "GET",
  path: "/v1/elections/:id/results",
  params: getElectionResultsParamsSchema,
  response: getElectionResultsResponseSchema
});
