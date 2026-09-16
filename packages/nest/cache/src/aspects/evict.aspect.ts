import type { LazyDecorator, WrapParams } from "@toss/nestjs-aop";
import { Aspect } from "@toss/nestjs-aop";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_SERVICE, type CacheService } from "../ports/cache-service.port";
import type { CacheEvictOptions } from "../decorators/evict.decorator";
import { CACHE_EVICT_DECORATOR } from "../decorators/evict.decorator";

@Aspect(CACHE_EVICT_DECORATOR)
@Injectable()
export class CacheEvictDecorator<TResult, TArgs = unknown> implements LazyDecorator<
  (...args: unknown[]) => Promise<TResult>,
  CacheEvictOptions<TArgs>
> {
  private readonly logger = new Logger(CacheEvictDecorator.name);

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cache: CacheService
  ) {}

  wrap({
    method,
    metadata
  }: WrapParams<(...args: unknown[]) => Promise<TResult>, CacheEvictOptions<TArgs>>) {
    return async (...args: unknown[]): Promise<TResult> => {
      const keyArg: TArgs = args.length === 1 ? (args[0] as TArgs) : (args as unknown as TArgs);
      const result = await method(...args);

      try {
        if (metadata.key) {
          await this.cache.del(metadata.key(keyArg));
          if (metadata.debug) this.logger.debug("Cache deleted for key");
        }

        if (metadata.keys) {
          const keys = metadata.keys(keyArg);
          await Promise.all(keys.map((key) => this.cache.del(key)));
          if (metadata.debug)
            this.logger.debug(`Cache deleted for multiple keys: ${keys.join(", ")}`);
        }

        if (metadata.prefix && this.cache.delPrefix) {
          await this.cache.delPrefix(metadata.prefix(keyArg));
          if (metadata.debug) this.logger.debug("Cache deleted for prefix");
        }
      } catch (err) {
        this.logger.warn(`Cache eviction failed: ${err}`);
      }

      return result;
    };
  }
}
