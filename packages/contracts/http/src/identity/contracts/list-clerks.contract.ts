import { defineContract } from "@signa/dsl-http-contract";
import { listClerksQuerySchema, listClerksResponseSchema } from "../schemas/list-clerks.schema";

export const listClerksContract = defineContract({
  method: "GET",
  path: "/v1/clerks",
  query: listClerksQuerySchema,
  response: listClerksResponseSchema
});
