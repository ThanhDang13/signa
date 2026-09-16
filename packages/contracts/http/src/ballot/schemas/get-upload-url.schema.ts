import { z } from "zod";

export const getUploadUrlParamsSchema = z.object({
  ballotId: z.string().uuid()
});

export const getUploadUrlSchema = z.object({
  contentType: z.string().default("image/jpeg")
});

export const getUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  s3Key: z.string(),
  expiresIn: z.number()
});
