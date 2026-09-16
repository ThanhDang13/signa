import { z } from "zod";
import { formStructureSchema } from "@signa/shared";

export const updateElectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  formStructure: formStructureSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxVoters: z.number().int().positive().optional()
});

export const updateElectionResponseSchema = z.object({
  message: z.string()
});
