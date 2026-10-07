import { z } from "zod";

export const createClerkSchema = z.object({
  email: z.string().email(),
  fullname: z.string().min(1),
  password: z.string().min(8)
});

export const createClerkResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullname: z.string(),
  role: z.string()
});
