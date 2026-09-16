import { z } from "zod";

export const deleteBallotResponseSchema = z.object({
  message: z.string()
});
