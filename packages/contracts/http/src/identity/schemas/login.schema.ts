import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});
