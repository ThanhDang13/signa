import { defineContract } from "@signa/dsl-http-contract";
import { deleteBallotResponseSchema } from "../schemas/delete-ballot.schema";
import { z } from "zod";

export const deleteBallotContract = defineContract({
  method: "DELETE",
  path: "/v1/ballots/:id",
  params: z.object({ id: z.string().uuid() }),
  response: deleteBallotResponseSchema
});
