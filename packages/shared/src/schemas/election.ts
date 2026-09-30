import { z } from "zod";
import { electionStatusSchema, formStructureSchema } from "./voting";

/**
 * Election read model schema - used across application and HTTP layer
 */
export const electionReadModelSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  formStructure: formStructureSchema,
  status: electionStatusSchema,
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  maxVoters: z.number().int().positive().optional(),
  createdById: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});
