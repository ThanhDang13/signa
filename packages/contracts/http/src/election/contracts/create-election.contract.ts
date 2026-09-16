import { defineContract } from "@signa/dsl-http-contract";
import { createElectionSchema, createElectionResponseSchema } from "../schemas/create-election.schema";

export const createElectionContract = defineContract({
  method: "POST",
  path: "/v1/elections",
  body: createElectionSchema,
  response: createElectionResponseSchema
});
