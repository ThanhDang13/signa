import { defineContract } from "@signa/dsl-http-contract";
import { getClerkParamsSchema, getClerkResponseSchema } from "../schemas/get-clerk.schema";

export const getClerkContract = defineContract({
  method: "GET",
  path: "/v1/clerks/:id",
  params: getClerkParamsSchema,
  response: getClerkResponseSchema
});
