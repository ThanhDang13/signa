import { z } from "zod";

export const updateClerkParamsSchema = z.object({
  id: z.string().uuid()
});

export const updateClerkSchema = z.object({
  email: z.string().email().optional(),
  fullname: z.string().min(1).optional()
});

export const updateClerkResponseSchema = z.object({
  message: z.string()
});
