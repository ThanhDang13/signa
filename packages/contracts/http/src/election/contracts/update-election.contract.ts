import { defineContract } from "@signa/dsl-http-contract";
import { updateElectionSchema, updateElectionResponseSchema } from "../schemas/update-election.schema";
import { z } from "zod";

export const updateElectionContract = defineContract({
  method: "PATCH",
  path: "/v1/elections/:id",
  params: z.object({ id: z.string().uuid() }),
  body: updateElectionSchema,
  response: updateElectionResponseSchema
});
