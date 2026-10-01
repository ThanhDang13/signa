import { getCurrentUserResponseSchema } from "../../identity/schemas";
import { defineContract } from "@signa/dsl-http-contract";

export const getCurrentUserContract = defineContract({
  method: "GET",
  path: "/v1/auth/me",
  response: getCurrentUserResponseSchema
});
