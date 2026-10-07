import { z } from "zod";

export const deleteClerkParamsSchema = z.object({
  id: z.string().uuid()
});

export const deleteClerkResponseSchema = z.object({
  message: z.string()
});
