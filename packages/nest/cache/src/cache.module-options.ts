import type { InjectionToken, ModuleMetadata, Type } from "@nestjs/common";
import type { CacheService } from "./ports/cache-service.port";

/**
 * Runtime cache configuration
 */
export interface NestCacheOptions {
  /**
   * Cache service implementation.
   * Use createRedisCacheService() or createInMemoryCacheService()
   */
  cache: CacheService;
}

/**
 * Injection token for cache options
 */
export const NEST_CACHE_OPTIONS = Symbol("NEST_CACHE_OPTIONS");

/**
 * Async factory interface (class-based)
 */
export interface NestCacheOptionsFactory {
  create(): NestCacheOptions | Promise<NestCacheOptions>;
}

/**
 * Async module configuration options
 */
export interface NestCacheModuleAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  /**
   * Factory-based config
   */
  useFactory?: (...args: unknown[]) => NestCacheOptions | Promise<NestCacheOptions>;

  /**
   * Class-based config provider
   */
  useClass: Type<NestCacheOptionsFactory>;

  /**
   * Inject dependencies for useFactory
   */
  inject?: InjectionToken[];
}
