import { createConfigToken } from "@signa/nest-config";
import { z } from "zod";
import { queueConfigSchema, s3ConfigSchema, appConfigSchema } from "./schema";

export type QueueConfig = z.infer<typeof queueConfigSchema>;
export type S3Config = z.infer<typeof s3ConfigSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;

export const QUEUE_CONFIG = createConfigToken<QueueConfig>("QUEUE_CONFIG");
export const S3_CONFIG = createConfigToken<S3Config>("S3_CONFIG");
export const APP_CONFIG = createConfigToken<AppConfig>("APP_CONFIG");
