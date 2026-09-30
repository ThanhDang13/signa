import { defineContract } from "@signa/dsl-http-contract";
import { listBallotsQuerySchema, listBallotsResponseSchema } from "../schemas/list-ballots.schema";

export const listBallotsContract = defineContract({
  method: "GET",
  path: "/v1/ballots",
  query: listBallotsQuerySchema,
  response: listBallotsResponseSchema
});
