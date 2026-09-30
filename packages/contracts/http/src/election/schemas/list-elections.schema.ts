import { z } from "zod";
import { createPaginationQuerySchema, paginatedResponseSchema } from "@signa/shared";
import { electionStatusSchema } from "@signa/shared";
import { electionReadModelSchema } from "@signa/shared";

export const listElectionsQuerySchema = createPaginationQuerySchema({
  sortBy: z.enum(["title", "status", "startDate", "createdAt"]).default("createdAt"),
  status: electionStatusSchema.optional(),
  createdById: z.string().uuid().optional()
});

export const listElectionsResponseSchema = paginatedResponseSchema(electionReadModelSchema);
