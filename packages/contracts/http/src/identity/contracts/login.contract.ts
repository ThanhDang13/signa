import { loginSchema, loginResponseSchema } from "../../identity/schemas";
import { defineContract } from "@signa/dsl-http-contract";

export const loginContract = defineContract({
  method: "POST",
  path: "/v1/auth/login",
  body: loginSchema,
  response: loginResponseSchema
});
