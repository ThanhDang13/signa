import { defineContract } from "@signa/dsl-http-contract";
import { z } from "zod";
import {
  listBallotBatchesQuerySchema,
  listBallotBatchesResponseSchema
} from "../schemas/list-ballot-batches.schema";

export const listBallotBatchesContract = defineContract({
  method: "GET",
  path: "/v1/elections/:electionId/ballot-batches",
  params: z.object({
    electionId: z.string().uuid()
  }),
  query: listBallotBatchesQuerySchema,
  response: listBallotBatchesResponseSchema
});
