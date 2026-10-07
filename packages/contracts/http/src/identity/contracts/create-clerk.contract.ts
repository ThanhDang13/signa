import { defineContract } from "@signa/dsl-http-contract";
import { createClerkSchema, createClerkResponseSchema } from "../schemas/create-clerk.schema";

export const createClerkContract = defineContract({
  method: "POST",
  path: "/v1/clerks",
  body: createClerkSchema,
  response: createClerkResponseSchema
});
