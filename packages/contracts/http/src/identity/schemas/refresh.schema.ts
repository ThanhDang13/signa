import { z } from "zod";

export const refreshSchema = z.object({
  refreshToken: z.string()
});

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string()
});
