import z from "zod";
import { jwtConfigSchema } from "@signa/nest-jwt";
import { queueConfigSchema } from "@signa/nest-queue";
import { cacheConfigSchema } from "@signa/nest-cache";
import { s3ConfigSchema } from "@signa/nest-s3";

export const appConfigSchema = z.object({
  port: z.number(),
  node: z.enum(["development", "production", "test"]),
  isDev: z.boolean(),
  ballotSecret: z.string().min(32)
});

export const databaseConfigSchema = z.object({
  user: z.string(),
  password: z.string(),
  host: z.string(),
  port: z.coerce.number(),
  database: z.string(),
  url: z.string()
});

export { jwtConfigSchema, queueConfigSchema, cacheConfigSchema, s3ConfigSchema };
