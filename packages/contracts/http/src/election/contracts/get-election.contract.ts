import { defineContract } from "@signa/dsl-http-contract";
import { getElectionParamsSchema, getElectionResponseSchema } from "../schemas/get-election.schema";

export const getElectionContract = defineContract({
  method: "GET",
  path: "/v1/elections/:id",
  params: getElectionParamsSchema,
  response: getElectionResponseSchema
});
