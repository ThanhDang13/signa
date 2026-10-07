import { z } from "zod";

export const resetClerkPasswordParamsSchema = z.object({
  id: z.string().uuid()
});

export const resetClerkPasswordSchema = z.object({
  password: z.string().min(8)
});

export const resetClerkPasswordResponseSchema = z.object({
  message: z.string()
});
