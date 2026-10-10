import { z } from "zod";
import { createPaginationQuerySchema, paginatedResponseSchema, ballotBatchReadModelSchema } from "@signa/shared";

export const listBallotBatchesQuerySchema = createPaginationQuerySchema({
  sortBy: z.enum(["createdAt", "status"]).default("createdAt")
});

export const listBallotBatchesResponseSchema = paginatedResponseSchema(ballotBatchReadModelSchema);
