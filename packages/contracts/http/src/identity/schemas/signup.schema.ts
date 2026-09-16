import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  fullname: z.string().min(1),
  password: z.string().min(8)
});

export const signupResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});
