import type { OnModuleDestroy } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import Redis from "ioredis";
import type { CacheService } from "../ports/cache-service.port";

export interface RedisCacheOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export class RedisCacheService implements CacheService, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisCacheService.name);
  private hasLoggedError = false;

  constructor(options: RedisCacheOptions) {
    this.redis = new Redis({
      host: options.host,
      port: options.port,
      password: options.password,
      db: options.db,
      retryStrategy: (times) => Math.min(times * 100, 2000)
    });

    this.redis.on("error", () => {
      if (!this.hasLoggedError) {
        this.hasLoggedError = true;
        this.logger.warn("[Redis] unavailable, retrying connection...");
      }
    });

    this.redis.on("ready", () => {
      if (this.hasLoggedError) {
        this.logger.log("[Redis] reconnected");
      }
      this.hasLoggedError = false;
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);

    if (ttlSeconds) {
      await this.redis.set(key, payload, "EX", ttlSeconds);
      return;
    }

    await this.redis.set(key, payload);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: `${prefix}*`,
      count: 100
    });

    const pipeline = this.redis.pipeline();
    let count = 0;

    for await (const keys of stream) {
      for (const key of keys) {
        pipeline.del(key);
        count++;
      }
    }

    if (count > 0) {
      await pipeline.exec();
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}

/**
 * Factory function to create a Redis cache service.
 */
export function createRedisCacheService(options: RedisCacheOptions): CacheService {
  return new RedisCacheService(options);
}
