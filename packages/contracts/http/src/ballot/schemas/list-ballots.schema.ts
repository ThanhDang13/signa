import { z } from "zod";
import { createPaginationQuerySchema, paginatedResponseSchema } from "@signa/shared";
import { ballotStatusSchema } from "@signa/shared";
import { ballotReadModelSchema } from "@signa/shared";

export const listBallotsQuerySchema = createPaginationQuerySchema({
  sortBy: z.enum(["generatedAt", "status", "createdAt"]).default("createdAt"),
  electionId: z.string().uuid().optional(),
  status: ballotStatusSchema.optional()
});

export const listBallotsResponseSchema = paginatedResponseSchema(ballotReadModelSchema);
