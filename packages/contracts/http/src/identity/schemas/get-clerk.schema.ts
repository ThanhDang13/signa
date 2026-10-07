import { z } from "zod";

export const getClerkParamsSchema = z.object({
  id: z.string().uuid()
});

export const getClerkResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullname: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  role: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});
