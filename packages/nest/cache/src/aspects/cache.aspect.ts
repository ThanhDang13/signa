import type { LazyDecorator, WrapParams } from "@toss/nestjs-aop";
import { Aspect } from "@toss/nestjs-aop";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { CacheOptions } from "../decorators/cache.decorator";
import { CACHE_DECORATOR } from "../decorators/cache.decorator";
import { CACHE_SERVICE, type CacheService } from "../ports/cache-service.port";

@Aspect(CACHE_DECORATOR)
@Injectable()
export class CacheDecorator<TResult, TArgs = unknown> implements LazyDecorator<
  (...args: unknown[]) => Promise<TResult>,
  CacheOptions<TArgs>
> {
  private readonly logger = new Logger(CacheDecorator.name);

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cache: CacheService
  ) {}

  wrap({
    method,
    metadata
  }: WrapParams<(...args: unknown[]) => Promise<TResult>, CacheOptions<TArgs>>) {
    return async (...args: unknown[]): Promise<TResult> => {
      const keyArg: TArgs = args.length === 1 ? (args[0] as TArgs) : (args as unknown as TArgs);
      const key = metadata.key(keyArg);

      try {
        const cached = await this.cache.get<TResult>(key);
        if (cached !== null) {
          if (metadata.debug) this.logger.debug(`Cache hit for key: ${key}`);
          return cached;
        }

        if (metadata.debug) this.logger.log(`Cache miss for key: ${key}`);
        const result = await method(...args);

        if (result !== undefined) {
          try {
            await this.cache.set(key, result, metadata.ttl);
          } catch (err) {
            this.logger.warn(`Failed to set cache for key: ${key}: ${err}`);
          }
        }

        return result;
      } catch (err) {
        this.logger.error(`Cache operation failed for key: ${key}: ${err}`);
        return method(...args);
      }
    };
  }
}
