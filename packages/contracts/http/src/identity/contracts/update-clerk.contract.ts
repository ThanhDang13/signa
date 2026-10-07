import { defineContract } from "@signa/dsl-http-contract";
import { updateClerkParamsSchema, updateClerkSchema, updateClerkResponseSchema } from "../schemas/update-clerk.schema";

export const updateClerkContract = defineContract({
  method: "PATCH",
  path: "/v1/clerks/:id",
  params: updateClerkParamsSchema,
  body: updateClerkSchema,
  response: updateClerkResponseSchema
});
