import { z } from "zod";

/**
 * S3 credentials schema
 */
export const s3CredentialsSchema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string()
});

/**
 * S3 configuration schema
 */
export const s3ConfigSchema = z.object({
  bucket: z.string(),
  region: z.string(),
  credentials: s3CredentialsSchema,
  endpoint: z.string().optional(),
  publicEndpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional().default(false)
});

export type S3Credentials = z.infer<typeof s3CredentialsSchema>;
export type S3Config = z.infer<typeof s3ConfigSchema>;
