import { defineContract } from "@signa/dsl-http-contract";
import { createBallotSchema, createBallotResponseSchema } from "../schemas/create-ballot.schema";

export const createBallotContract = defineContract({
  method: "POST",
  path: "/v1/ballots",
  body: createBallotSchema,
  response: createBallotResponseSchema
});
