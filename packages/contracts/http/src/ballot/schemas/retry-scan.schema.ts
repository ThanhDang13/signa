import { z } from "zod";

export const retryScanParamsSchema = z.object({
  requestId: z.string().uuid()
});

export const retryScanBodySchema = z.object({
  s3Key: z.string()
});

export const retryScanResponseSchema = z.object({
  message: z.string(),
  requestId: z.string().uuid()
});
