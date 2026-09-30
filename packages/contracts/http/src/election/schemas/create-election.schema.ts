import { z } from "zod";
import { formStructureSchema } from "@signa/shared";

export const createElectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  formStructure: formStructureSchema,
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  maxVoters: z.number().int().positive().optional()
});

export const createElectionResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string()
});
