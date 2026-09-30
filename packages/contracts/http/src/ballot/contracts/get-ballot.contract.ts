import { defineContract } from "@signa/dsl-http-contract";
import { getBallotParamsSchema, getBallotResponseSchema } from "../schemas/get-ballot.schema";

export const getBallotContract = defineContract({
  method: "GET",
  path: "/v1/ballots/:id",
  params: getBallotParamsSchema,
  response: getBallotResponseSchema
});
