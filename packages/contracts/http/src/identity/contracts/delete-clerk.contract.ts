import { defineContract } from "@signa/dsl-http-contract";
import { deleteClerkParamsSchema, deleteClerkResponseSchema } from "../schemas/delete-clerk.schema";

export const deleteClerkContract = defineContract({
  method: "DELETE",
  path: "/v1/clerks/:id",
  params: deleteClerkParamsSchema,
  response: deleteClerkResponseSchema
});
