export * from "./cache.module";
export * from "./cache.module-options";
export * from "./cache.config";
export * from "./ports/cache-service.port";
export * from "./decorators/cache.decorator";
export * from "./decorators/evict.decorator";
export * from "./aspects/cache.aspect";
export * from "./aspects/evict.aspect";

// Factory functions for cache implementations
export { createRedisCacheService, type RedisCacheOptions } from "./adapters/redis-cache.service";

export { createInMemoryCacheService } from "./adapters/in-memory-cache.service";
