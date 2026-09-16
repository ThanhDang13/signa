import type { DynamicModule, Provider } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { AopModule } from "@toss/nestjs-aop";
import type { CacheService } from "./ports/cache-service.port";
import { CACHE_SERVICE } from "./ports/cache-service.port";
import { CacheDecorator } from "./aspects/cache.aspect";
import { CacheEvictDecorator } from "./aspects/evict.aspect";

import {
  NEST_CACHE_OPTIONS,
  NestCacheOptions,
  NestCacheModuleAsyncOptions,
  NestCacheOptionsFactory
} from "./cache.module-options";

/**
 * Cache module with decorator-based caching support
 *
 * @example
 * ```typescript
 * // In your config service
 * @Injectable()
 * export class CacheConfig implements NestCacheOptionsFactory {
 *   constructor(@InjectConfig(CACHE_CONFIG) private config: CacheConfig) {}
 *
 *   create(): NestCacheOptions {
 *     if (this.config.type === "redis") {
 *       return {
 *         cache: createRedisCacheService({
 *           host: this.config.redis.host,
 *           port: this.config.redis.port,
 *           password: this.config.redis.password,
 *           db: this.config.redis.db
 *         })
 *       };
 *     }
 *     return {
 *       cache: createInMemoryCacheService()
 *     };
 *   }
 * }
 *
 * // In your module
 * @Module({
 *   imports: [
 *     CacheModule.registerAsync({
 *       useClass: CacheConfig
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class CacheModule {
  /**
   * Register cache module asynchronously with config provider
   */
  static registerAsync(options: NestCacheModuleAsyncOptions): DynamicModule {
    const optionsProvider = {
      provide: NEST_CACHE_OPTIONS,
      useFactory: async (factory: NestCacheOptionsFactory) => {
        return factory.create();
      },
      inject: [options.useClass]
    };

    const optionsModule: DynamicModule = {
      module: class CacheOptionsModule {},
      imports: options.imports,
      providers: [
        {
          provide: options.useClass,
          useClass: options.useClass
        },
        optionsProvider
      ],
      exports: [NEST_CACHE_OPTIONS]
    };

    const cacheServiceProvider: Provider = {
      provide: CACHE_SERVICE,
      useFactory: async (opts: NestCacheOptions) => {
        return opts.cache;
      },
      inject: [NEST_CACHE_OPTIONS]
    };

    return {
      module: CacheModule,
      imports: [AopModule, optionsModule, ...(options.imports ?? [])],
      providers: [
        options.useClass,
        optionsProvider,
        cacheServiceProvider,
        CacheDecorator,
        CacheEvictDecorator
      ],
      exports: [CACHE_SERVICE, CacheDecorator, CacheEvictDecorator, NEST_CACHE_OPTIONS]
    };
  }
}
