import { queueConfigSchema } from "@signa/nest-queue";
import { s3ConfigSchema } from "@signa/nest-s3";
import { z } from "zod";

// Re-export schemas from adapters for use in defineConfig
export { queueConfigSchema, s3ConfigSchema };

export const appConfigSchema = z.object({
  node: z.enum(["development", "production", "test"]),
  isDev: z.boolean(),
  ballotSecret: z.string().min(32).describe("Secret for ballot HMAC signature verification")
});
