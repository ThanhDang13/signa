import { defineContract } from "@signa/dsl-http-contract";
import {
  generateBallotsSchema,
  generateBallotsResponseSchema
} from "../schemas/generate-ballots.schema";

export const generateBallotsContract = defineContract({
  method: "POST",
  path: "/v1/ballots/generate",
  body: generateBallotsSchema,
  response: generateBallotsResponseSchema
});
