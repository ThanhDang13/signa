import { defineContract } from "@signa/dsl-http-contract";
import { refreshSchema, refreshResponseSchema } from "../schemas/refresh.schema";

export const refreshContract = defineContract({
  method: "POST",
  path: "/v1/auth/refresh",
  body: refreshSchema,
  response: refreshResponseSchema
});
