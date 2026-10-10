import { z } from "zod";
import { formStructureSchema } from "@signa/shared";

export const updateElectionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  formStructure: formStructureSchema.optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  maxVoters: z.coerce.number().int().positive().optional()
});

export const updateElectionResponseSchema = z.object({
  message: z.string()
});
