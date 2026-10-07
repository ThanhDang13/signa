import { defineContract } from "@signa/dsl-http-contract";
import {
  resetClerkPasswordParamsSchema,
  resetClerkPasswordSchema,
  resetClerkPasswordResponseSchema
} from "../schemas/reset-clerk-password.schema";

export const resetClerkPasswordContract = defineContract({
  method: "PATCH",
  path: "/v1/clerks/:id/password",
  params: resetClerkPasswordParamsSchema,
  body: resetClerkPasswordSchema,
  response: resetClerkPasswordResponseSchema
});
