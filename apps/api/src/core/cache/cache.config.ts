import { Injectable } from "@nestjs/common";
import { InjectConfig } from "@signa/nest-config";
import {
  NestCacheOptionsFactory,
  NestCacheOptions,
  createRedisCacheService,
  createInMemoryCacheService
} from "@signa/nest-cache";
import { CACHE_CONFIG, type CacheConfig } from "@signa/api/core/config/tokens";

@Injectable()
export class CacheConfigService implements NestCacheOptionsFactory {
  constructor(
    @InjectConfig(CACHE_CONFIG)
    private readonly config: CacheConfig
  ) {}

  create(): NestCacheOptions {
    if (this.config.type === "redis") {
      return {
        cache: createRedisCacheService({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          db: this.config.redis.db
        })
      };
    }

    return {
      cache: createInMemoryCacheService()
    };
  }
}
