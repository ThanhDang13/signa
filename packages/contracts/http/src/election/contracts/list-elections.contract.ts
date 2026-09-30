import { defineContract } from "@signa/dsl-http-contract";
import { listElectionsQuerySchema, listElectionsResponseSchema } from "../schemas/list-elections.schema";

export const listElectionsContract = defineContract({
  method: "GET",
  path: "/v1/elections",
  query: listElectionsQuerySchema,
  response: listElectionsResponseSchema
});
