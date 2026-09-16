import { z } from "zod";

/**
 * Redis connection configuration schema
 */
export const redisConfigSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  password: z.string().optional(),
  db: z.coerce.number().optional().default(0)
});

/**
 * Queue module configuration schema
 */
export const queueConfigSchema = z.object({
  redis: redisConfigSchema,
  defaultJobOptions: z
    .object({
      attempts: z.number().optional().default(3),
      backoff: z
        .object({
          type: z.enum(["exponential", "fixed"]).default("exponential"),
          delay: z.number().default(1000)
        })
        .optional(),
      removeOnComplete: z.union([z.boolean(), z.number()]).optional().default(100),
      removeOnFail: z.union([z.boolean(), z.number()]).optional().default(50)
    })
    .optional()
});

export type RedisConfig = z.infer<typeof redisConfigSchema>;
export type QueueConfig = z.infer<typeof queueConfigSchema>;
