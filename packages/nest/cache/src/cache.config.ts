import { z } from "zod";

/**
 * Redis cache configuration schema
 */
export const redisCacheConfigSchema = z.object({
  host: z.string(),
  port: z.coerce.number(),
  password: z.string().optional(),
  db: z.coerce.number().optional().default(0)
});

/**
 * Cache type discriminator
 */
export const cacheConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("redis"),
    redis: redisCacheConfigSchema
  }),
  z.object({
    type: z.literal("memory")
  })
]);

export type RedisCacheConfig = z.infer<typeof redisCacheConfigSchema>;
export type CacheConfig = z.infer<typeof cacheConfigSchema>;
