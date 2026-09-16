import { z } from "zod";

export const activateElectionResponseSchema = z.object({
  message: z.string()
});

export const closeElectionResponseSchema = z.object({
  message: z.string()
});

export const deleteElectionResponseSchema = z.object({
  message: z.string()
});
