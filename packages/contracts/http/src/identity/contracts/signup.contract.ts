import { defineContract } from "@signa/dsl-http-contract";
import { signupSchema, signupResponseSchema } from "../schemas/signup.schema";

export const signupContract = defineContract({
  method: "POST",
  path: "/v1/auth/signup",
  body: signupSchema,
  response: signupResponseSchema
});
