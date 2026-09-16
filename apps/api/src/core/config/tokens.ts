import {
  appConfigSchema,
  databaseConfigSchema,
  queueConfigSchema,
  cacheConfigSchema,
  s3ConfigSchema
} from "@signa/api/core/config/schema";
import { createConfigToken } from "@signa/nest-config";
import { JwtConfig } from "@signa/nest-jwt";
import z from "zod";

export type AppConfig = z.infer<typeof appConfigSchema>;

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

export type QueueConfig = z.infer<typeof queueConfigSchema>;

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

export type S3Config = z.infer<typeof s3ConfigSchema>;

export { type JwtConfig };

export const APP_CONFIG = createConfigToken<AppConfig>("APP_CONFIG");
export const DATABASE_CONFIG = createConfigToken<DatabaseConfig>("DATABASE_CONFIG");
export const JWT_CONFIG = createConfigToken<JwtConfig>("SECURITY_CONFIG");
export const QUEUE_CONFIG = createConfigToken<QueueConfig>("QUEUE_CONFIG");
export const CACHE_CONFIG = createConfigToken<CacheConfig>("CACHE_CONFIG");
export const S3_CONFIG = createConfigToken<S3Config>("S3_CONFIG");
