import { z } from "zod";

export const generateBallotsSchema = z.object({
  electionId: z.string().uuid(),
  count: z.number().int().positive().max(10000)
});

export const generateBallotsResponseSchema = z.object({
  message: z.string(),
  jobsEnqueued: z.number()
});
